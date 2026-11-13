# Plan - TASK ai-mcp

## Status

- Mode: B (planner pass of 2026-11-13 on `claude/ai-mcp-b5plan`, after
  landing 3: `claude/ai-mcp` at `8571dbe0` merged in; B3, B2b and the
  shipped design sections collapsed to their outcomes; the plan review
  before B5b and the UI action audit applied).
- Batches: B0 and B1 done (landing 1, `aeb68c0e`); B2a done (landing 2,
  `89a55f1b`); B3 and B2b done (landing 3, `c4742c53`, live on production;
  step 14's readings are in `context.md`, "Landing 3 readings and owner
  instructions"; the owner's decision on the cold readings is open, B3
  outcome); B5a implement-ready (next); B5b implement-ready; B5c and B5d
  implement-ready (files and steps given, plan-B5b-R6); B4 dropped. Order
  and landings: section 6, "Order of the remaining batches" (D8).
- NEEDS_HUMAN_CONFIRMATION: no. Q1-Q7 settled; Q8, Q10, Q11, the R1, R7
  and N10 options and the defaults of 2026-11-12 are "default taken (owner
  AFK)" (section 7); Q9 is replaced by the owner's parity rule; the B3
  pass, the B5 refresh and this pass add their defaults (section 7). No
  product law changes beyond section 3.6; D7's grant level is unchanged.
- Plan review: required before B1 (trigger: a public contract change - the read API `/api/v1/`; a product-law change). The CORS rule of 2026-11-10 is part of the same contract change.
- Plan review: required before B5a (trigger: a migration that changes the PostgREST role config and adds restrictive table and storage policies and a SECURITY DEFINER helper; a new write and sync protocol; possible loss of stored data by a connected app's delete; a public contract change - `/api/v1/me/`, `/mcp/me`, a new app route).
- Plan review: required before B5b (trigger: the B5 refresh of 2026-11-12 widens B5a's migration to the whole parity scope - more RPCs, table writes and storage inserts for a client token; new public contracts B5b, B5c and B5d; possible loss of stored data by bulk deletes, an import that overwrites, and share-link revokes; a new write and sync protocol). The report is `reviews/plan-B5b.md` with "Scope: plan before B5b" and covers the B5a delta, B5b, B5c and B5d (the second plan look that `handoff.md` recommended as `plan-B5a-2.md`; this line makes `agent-guard.mjs` enforce it).
- Plan review: required before B2a (trigger: a public contract change - the MCP endpoint `/mcp`, its tool names and shapes, the record `link` value, `docs/fixtures/mcp/`, `CONTRACTS.md` sections 5 and 6, `llms.txt`; B2b's `llms.txt` links). Done: `reviews/plan-B2a.md`, fix-then-continue, applied (below); it covers B2b too.
- Plan review: required before B3 (trigger: a public contract change - `GET /api/v1/records`, `POST /api/v1/file-checks`, the `filter` parameter of `GET /api/v1/tables/{table}`, the MCP tools `search_catalog` and `check_file`, the answer formats `api-search` and `api-file-check`, the error code `too_broad`, `openapi.json` 1.2.0, `CONTRACTS.md` section 6, `llms.txt`). No other trigger fires: no migration, no stored data, no write or sync protocol.
- Plan review findings applied: reviews/plan-B5b.md
  - plan-B5b-1 (B5a steps 1 and 8, D7, section 7 "Owner stop", section 9, `handoff.md` Blockers): step 1 measures the OAuth consent endpoints with a client token (details, approve, `listGrants`, `revokeGrant`); an approve by a client token is a stop; a list or a revoke is recorded and named on the privacy pages; D7 says Auth is bounded by step 1's measurement and its stop rule, not by the database.
  - plan-B5b-2 (B5a step 6, acceptance 11 and 19, Standing check 1): `/connect?authorization_id=<id>` becomes the route key `#/connect/<id>` with the bar at `/connect/<id>`; `_redirects` gets `/connect/*` and `/en/connect/*`; `ROUTES.md` and the route fixtures carry it; a sign-in from the signed-out page returns to the same id (tests).
  - plan-B5b-3 (B5b operations L15 and L17, acceptance 14 and 16, Standing check 2): a relative bulk edit requires `If-Match` on the list revision (428 without, 412 when stale, nothing written); absolute bodies take none; the remaining window is named.
  - plan-B5b-4 (Common rules "Imports" and "Exports", the B5b L2 row, acceptance 5 and 17, Scale; B5c; B5d placed line 3; section 7): the landing-3 numbers replace the prediction; the import cap stays 32768 B with no condition; export pages start at 32768 B; L2 reads with a 65536 B cap and answers 422 past it.
  - R1 (B5a step 10, acceptance 20): B5a raises each bundle limit it passes to the measured total in the same commit by the README rule and runs the configured line.
  - R2 (B5b step 3, acceptance 25, section 7): `/mcp/me` lists the public tools after the account tools; default taken (owner AFK).
  - R3 (B5a step 6, acceptance 21): `_headers` refuses the framing of the consent route; a framed page draws the expired page.
  - R4 (B5a steps 1 and 5, Standing check 1): `host` is the redirect URI's host when the grant answer carries it, else `client.uri`'s; a non-https redirect shows its scheme and host as given.
  - R5 ("UI action coverage" intro, B5a "Audit fold-in", the B5d objective): a gap that needs a guard name or a consent fact folds into B5a; the audit found none.
  - R6 (B5c, B5d): B5c gains its files, steps and the H11 CPU line; B5d gains files and steps; neither needs a planner pass unless a gap row needs a guard name.
  - R7 (B5a steps 1, 3 and 4, acceptance 22; section 10): step 1 measures `grant_type=client_credentials`; a token with `client_id` and no live session is refused (a test).
  - R8 (Common rules "Subrequests" and "Imports"): at most 20 subrequests an operation, the AL ops of one call in one request; the lists import reads the `importPlan` context and follows the app's retry rule.
  - R9 (Status, section 6 order, B3, B2b, sections 3.3, 3.4, 3.5, 3.8, 5.3, 7, 9, 11, `handoff.md`): `claude/ai-mcp` merged in; B3, B2b and the shipped design text collapsed (`git show 51f830de:issues/ai-mcp/plan.md`); the stale "B5b placed line" mentions point at B5d.
  - N1 (B5a steps 3 and 4): `api_client_session_live()` takes no argument; a missing or malformed `session_id` answers false (a `tests/db` case).
  - N2 (Common rules "Stop before delete"): `confirm` is the number of ids or entries in the call; a retry answers each gone id as deleted.
  - N3 (B5a step 3): the storage policies are `for update` and `for delete`, never `for all`, with the reason they stay.
  - N4 (B5a steps 1 and 8): a possible global logout or `data` change is recorded, and both privacy pages name a global logout.
  - N5 (B5b Standing check 2): a client token at PostgREST can delete every list in one call; the consent text names that a deletion cannot be undone.
  - N6 (B5b step 4, acceptance 26; B5c and B5d acceptance; the closeout): `openapi.json` goes to 1.3.0 once in B5b, and B5c and B5d extend it; the live `ETag` check moves to the closeout.
  - N7 (B5d placed line 4, the B5 table text, `handoff.md`): the issue 72 follow-up is a closeout step; B5d keeps "the A2 text names the shipped operations".
  - N8 (B5a step 9): `config:diff -- --project prod` before the production push; production's OAuth metadata read before the closeout.
  - N9 (B5d step 2): the print builder moves to `lib/` if it lives in a component.
- UI action audit applied: reviews/audit-ui-actions.md
  - B1 (Common rules "Imports", B5b acceptance 18, B5c acceptance 19): an optional `import_id`; every id the import makes is a UUIDv5 of it and the row's place in the file; a second apply with the same `import_id` adds nothing.
  - R1 (coverage row R8, B5d operations and acceptance 11): `GET /me/requests` and `list_my_requests` over every list.
  - R2 (coverage row L15, the B5b L15 row, acceptance 14): `{ guess: true }`, the `skipped` result, `{ set }` named an API addition; the `lib/` move clause dropped (both functions are in `lib/money.ts`).
  - R3 (coverage row L17, B5b step 3, acceptance 16 and 25): MCP `remove_from_list` takes `entries` with an optional `quantity`; `confirm` counts the entries.
  - R4 (coverage row H23, B5c imports, acceptance 19): the `targets` map of the homebrew import.
  - R5 (B5c MCP rule, acceptance 17): `add_card_member` answers 409 unless `move: true`; the old card first; 503 with the first write applied.
  - R6 (B5c `PUT` items, coverage row H10, B5c "Deviations"): the editor checks that the API applies are named.
  - R7 (the B5b L18 row, acceptance 17): a `skipped` count per list on the lists file.
  - N1 (exception X3): the wording names account data and the flow setting.
  - N2 (coverage rows S4 and L15): the place column names the API additions.
  - N3 (coverage row L13): the undo is L9, then L14.
  - N4 (B5b acceptance 7 and 11, B5c acceptance 14 and 16): "one case per row".
  - N5 (under the coverage table): the cross-reference to the public `get_shared_list`.
  - N6 (B5d acceptance 7): a request to the reader's own list is 409 `conflict`; default taken (owner AFK).
  - Placement (section 7, default taken (owner AFK), the auditor's recommendation): each finding goes to the batch of its own row (R2, R3, R7 to B5b; R4, R5, R6 to B5c; R1 to B5d), so no batch changes an operation another batch has shipped.
- Plan review findings applied: reviews/plan-B3.md
  - plan-B3-1 to plan-B3-N9: applied 2026-11-12 and shipped in B3 (`c4742c53`); the per-finding list is in `git show 51f830de:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B2a.md
  - plan-B2a-1 to plan-B2a-N13: applied 2026-11-12 and shipped in B2a (`89a55f1b`), B3 and B2b (`c4742c53`); the per-finding list is in `git show 8019493d:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B1.md
  - plan-B1-1 to plan-B1-N9: applied 2026-11-10 and shipped in B1 (`aeb68c0e`); the per-finding list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B1-2.md
  - plan-B1-2-1 to plan-B1-2-N6: applied 2026-11-10 and shipped in B0 and B1; the list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B1-3.md
  - plan-B1-3-1 to plan-B1-3-N9: applied 2026-11-11 and shipped in B0 and B1; the list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B5a.md
  - plan-B5a-1 to plan-B5a-N12: applied 2026-11-11 (B5a, B5b, D7 and the sections each names); the per-finding list is in `git show 8019493d:issues/ai-mcp/plan.md`, Status.
- B5 refresh (2026-11-12, owner AFK): the mocks `issues/ai-mcp/mocks/b5a-screens.html` and `mocks/png/`; section 6 B5 (the batch table, "UI action coverage", the common rules, B5a-B5d); `context.md` "B5 refresh facts (2026-11-12)".
- Total gate cost of the remaining work (`.claude/README.md`, "Batch size and the fixed cost of a run"; a review about 15 min): B5a about 60 min (`check:fast`, `check:db`, CI with the golden re-seed, its review), B5b, B5c and B5d about 45 min each (`check:fast`, CI, the review), the closeout squash about 23 min: about 3 h 40 min. A plan review before B5d (about 15 min) runs only if a later gap needs a guard name.

## 1. Objective and current state

The task `ai-mcp` gives AI assistants a remote MCP endpoint (settled Q1-Q3
of 2026-10-15, `context.md`). On 2026-11-10 the owner widened it:

1. The MCP server becomes a client of a shared backend: an API layer.
2. A second consumer, Charkeeper (GitHub issue 72), needs tables, options,
   a roll and an item payload.
3. The API is a general platform for other VTTs, character managers,
   Discord bots, GM tools, scripts and assistants; Charkeeper is the first
   worked example.
4. The planner may move any app function to the backend (roll logic,
   search, filters, sorting, tables, file checks, share-link resolution) and
   data from static files to the database, or reject a move with reasons.

Current state (2026-11-13): the public tier is live (B0-B3, landing 3
`c4742c53`): one stateless worker (`preview/worker.mjs`, Pages Functions
advanced mode) answers the cards, the read API `/api/v1/` and `/mcp` with
nine tools; `data.js` stays the only catalog authority; the two pages
`pages/ai.html` and `pages/developers.html` explain both. What remains is
the account tier B5 (section 6). The state before B1:
`git show 51f830de:issues/ai-mcp/plan.md`, section 1.

## 2. Scope and non-goals

In scope: the API layer and its two adapters (REST and MCP) in the
existing worker; build-time projections of the catalog; the product-law,
contract, `llms.txt`, privacy-page and spec changes; CORS for browser
clients on the public reads (owner, 2026-11-10); one aligned license
statement in every copy and a per-record rights audit (B0); the OAuth account tier as the last stage.

Non-goals: no change of what the app draws or how it rolls; no catalog in
the database; no new store (KV, Durable Object, D1); no API keys, no
per-client quota, no webhooks, no write endpoint for a third party before
B5; no export format other than the neutral record and no published
mapping to any consumer's schema: every consumer maps the record as it
wants (owner Q1, 2026-11-10).

## 3. Architecture

### 3.1 The layers

| Layer | Component | Runs in | Client of |
|---|---|---|---|
| L0 data | `data.js` (catalog authority) | git, build | - |
| L0 data | Supabase Postgres: accounts, lists, homebrew, shares; RLS and definer RPCs | Supabase (EU West) | - |
| L1 projections | `apidata/` files: the catalog cut for request-time reads, rendered by the app's own pure modules | `node tools/build.js`, published as static files | L0 `data.js` |
| L2 domain | pure modules `app/src/lib/*` (roll, std, alt, sections, rollTables, filters, search, i18n, label, markup, bundle, homebrewFile, cloudLists, homebrew) and the new `apiRecord.ts` | the app (browser), the build (Node) and the worker (bundled) | - |
| L3 service | `preview/api/service.mjs`: one function per API operation | the worker | L1 through `env.ASSETS`; L0 Supabase through PostgREST as `anon` (B5: with the reader's token); L2 |
| L4 adapters | `preview/api/rest.mjs` (`/api/v1/*`) and `preview/api/mcp.mjs` (`/mcp`), both generated from one `openapi.json` | the worker | L3, in process |
| L5 clients | Charkeeper (Rails server), Claude and ChatGPT connectors, scripts, bots, GM tools | outside | L4 over HTTPS |
| - | the app | the browser | L0 `data.js` and Supabase, as today; never L4 |

The MCP adapter calls the service in process, not over HTTP: an HTTP hop to
the same host costs a second Functions request per call and adds latency,
and gives no isolation, because both run in one deployment.

### 3.2 Options compared (owner question 1)

Decision (D1): (c), one worker API shared by MCP and REST over
build-time projections. It is the only option that serves two consumers
from one implementation with no new deploy channel, secret, runtime or
authority. The trade-off accepted: the 10 ms CPU limit, which shapes the
projections, and a quota that the cards, MCP and REST share. Not chosen:
(a) an MCP worker with its own logic (a second consumer re-implements
it); (b) a Supabase-hosted API with the MCP worker as a thin client (the
catalog in Postgres or bundled into a function, a project-ref URL, a new
deploy step with a broad token, a third runtime, a second request per
relayed call). Option (b) stays a named option for one operation only,
the file check, if landing 3's reading shows that it cannot fit 10 ms at
its 32768 B cap (D10); it needs an owner decision. The comparison table
(CPU, quota, catalog source, URL, deploy, runtimes):
`git show 8019493d:issues/ai-mcp/plan.md`, section 3.2.

### 3.3 What moves to the backend (owner clarification 1)

Settled and shipped (B1-B3; D1, D2, D10): the frontend keeps everything it
does today, and the app never calls the API. The backend serves (1)
build-time projections that the app's own modules render and (2)
request-time operations whose answer depends on input or randomness:
roll, filter, search, file check, and the two Supabase reads. Supabase
stays the only store and the authority for account data; B5 relays the
reader's token to it with no second write path. Not served: clipboard
text, print and card fitting, UI-only state; prices only inside B5b's
bulk price edit (`lib/money.ts`). Rejected: the app as a client of the
API, the catalog in Postgres, two implementations of any rule. The
per-area table: `git show 51f830de:issues/ai-mcp/plan.md`, section 3.3.

### 3.4 The contract (owner clarification 2)

Resource-oriented REST, version in the path, both languages in every text
field, JSON only. The public resources of B1-B3 (rolls, tables, records,
the bulk catalog, homebrew items and shared lists by id, search, the
table filter, file checks) are live; their list is `CONTRACTS.md` section
6 and `openapi.json`. B5 adds one row:

| Resource | Operation | Batch | Answer |
|---|---|---|---|
| `/api/v1/me/...` | every UI action on the reader's own data, read and write (section 6, "UI action coverage") | B5b (core, lists, share links), B5c (homebrew), B5d (requests, print sets) | `api-my-lists`, `api-my-list`, `api-my-items`, `api-my-item` v1 and the formats each batch names |

Versioning (D3; section 11): paths, parameter names, field names, the
`format` values and the CORS rule of v1 are frozen; a new optional
parameter, field or resource and a widened value list come in place;
anything else is `/api/v2/` beside v1. Clients ignore unknown fields.
`openapi.json` is the one source for the MCP tools. Sources and license
(owner Q2 = A, Q6 = C, Q7 = A; D3, D5): every source of `data.json`, with
`source`, `link` and `rights` on each record.

CORS (owner, 2026-11-10, D3; shipped): every public (T0) answer under
`/api/v1/` carries `Access-Control-Allow-Origin: *` with no credentials,
and the static catalog files and catalog images answer `*` from Pages;
`/mcp` sends no CORS headers and answers 403 to a browser `Origin` (MCP
spec, DNS rebinding); `apidata/` stays internal. The account paths
`/api/v1/me/` are outside that promise: B5b replaces the reserved
prefix's `*` with an explicit `Origin` allowlist, empty at B5b (the
reason is in "Common rules of the account API").

Auth tiers:

| Tier | Serves | Status |
|---|---|---|
| T0 public read, no key | rolls, tables, records, the bulk catalog, homebrew items by id, shared lists by token, file checks; an `Authorization` header is ignored and never forwarded, so a T0 answer never depends on the caller | B1-B3 |
| T1 API key | higher limits or revocation for one client | left out: a key needs a store (a table and an issue screen) or a Pages secret per client (a deploy per key), and the worker cannot count a quota per key without a store |
| T2 OAuth 2.1 (Supabase Auth server) | the reader's own data, read and write, every UI action but the exceptions of section 6, "UI action coverage", under `/api/v1/me/` and `/mcp/me`; an OAuth client token only (a token with `client_id`) | B5a (the guard and consent), B5b-B5d (the API) |

Sync (one design for catalog and account data, 2026-11-11): a consumer
pulls; daggerheart-loot is the authority and never pushes. Each
collection has a head list of `{ id, rev }`: the client diffs it against
what it holds, re-reads each id whose `rev` moved in batches, and drops
each id the head no longer lists (a delete; no tombstones exist, so
`updated_since` is not offered). The catalog's head is
`/api/v1/catalog/index.json` (`rev` per record, `data_version` for the
whole: an equal `data_version` skips the diff); the account's heads are
`GET /api/v1/me/lists` and `GET /api/v1/me/homebrew-items` (`rev` is the
row's `revision`; an account `rev` covers the row's own fields - `book`
and `content` for an item, the list fields and entries for a list - not
the parts of `record` drawn from other rows; a client that keeps
`record` reads it again when it reads that row, and reads each linked
item by the item heads), the pattern of the app's own re-read
(`docs/decisions/`, 2026-10-02, "The account re-read fetches only lists
whose revision moved"). Every head gives `rev` as an opaque string (an
account row: its revision in decimal), compared for equality only;
`ETag` is `"<rev>"`. Account writes are commands, not replication:
each create carries a client-made uuid (a retry is idempotent, as the
app's `upsert ... ignoreDuplicates` and `on conflict (id) do nothing`),
each homebrew-item update and each delete carries `If-Match: "<rev>"`
(on the row revision), and a list `PATCH` takes an optional `If-Match`;
without it, list fields follow the app's last-writer-wins rule (section
6, B5b).
Rejected: two-way replication (a merge on a third party's model); an
`updated_since` cursor (deletes are invisible without a tombstone table,
a migration, and clock skew); a collection `ETag` (a 304 costs the same
Functions request and Supabase read). A record's `id` is the sync key:
a catalog id is never renumbered (`CLAUDE.md`), a homebrew `id` is its
row uuid for the row's life, and `key` (section 5.3) is the value every
relation field holds.

Rate limits (owner Q5 = yes, 2026-11-10; shipped): none per client (the
worker keeps no state, and the free `pages.dev` host has no rate-limit
rule); the guard is the fair-use text of `openapi.json` and `llms.txt`,
`ETag` and `Cache-Control` on discovery answers, and one request per user
action. A quota burn stops the cards, the API and MCP until 00:00 UTC; the
app and its static pages keep working. A browser `POST` sends a preflight
that counts on the shared quota; `Access-Control-Max-Age` 86400 (2 h on
Chromium) limits it.

Sync and the quota: a catalog pull reads static files only (no Functions
request at any rate). An account sync costs two head reads plus one read
per 10 changed items and one read per changed list (a list has no batch
read), each a Functions request (and one to three
PostgREST calls on Supabase, which has no request quota on the Free plan,
egress apart). A background poll every 15 minutes is 96 x 2 = 192
requests a day per user, so 100 polling users take about 19 % of the
shared 100,000; every 5 minutes, about 58 %. The ceiling: at one poll
per 15 minutes the shared quota holds about 500 polling users in all
(100,000 / 192), less the app's card traffic; nothing shows when the
quota is near (section 10). The fair-use text of B5b
therefore says: sync on a user action; a background sync at most once
per 15 minutes per user. Token refresh goes from the client to Supabase
Auth directly and costs no Functions request.

Payload formats, caching, the OpenAPI source and what is left out:
shipped in B1-B3 (D3; `CONTRACTS.md` section 6): one neutral record v1
(section 5.3) and no `format=` parameter; `ETag: "<data_version>"` and a
304 on projection answers; `Cache-Control: no-store` on homebrew items,
shared lists and rolls, and `private, no-store` on every `/api/v1/me/`
answer (B5b); `openapi.json` is the one source of the REST routes and the
MCP tools. Left out until a consumer asks: API keys and per-key quotas,
webhooks, `sort` and `fields` parameters, GraphQL, SDKs. The full text:
`git show 51f830de:issues/ai-mcp/plan.md`, section 3.4.

### 3.5 CPU and size budgets

Shipped (B1-B3); the budgets are in `tests/derived.js` and
`tools/api-data.mjs` (`BUDGET`), the file counts in `.claude/README.md`,
"The CI deploy". Rules that later batches keep: every record and index
file at most 65536 B, every roll, table and cards file at most 131072 B,
a search shard at most 262144 B; a request reads at most five files,
cached ones included, and parses no JSON file past its budget; a
`data_version` mismatch is read again once, then 503. The production cost
model is a fixed floor (about 4.4 ms cold, 3.2 ms warm) plus K times the
local CPU (K 1.70-3.01; `context.md`, "Landing 2 readings"); landing 3's
cold readings were 3.9-13.8 ms REST and 19.5 ms MCP `check_file`
(`context.md`, "Landing 3 readings and owner instructions"). The file and
read tables: `git show 51f830de:issues/ai-mcp/plan.md`, section 3.5.

### 3.6 Product law and contract changes this design forces

Shipped in B1 and B2a (`CLAUDE.md` "Product laws", `PRODUCT.md`,
`META.md` sections 3 and 7, `.claude/README.md` "Preview host", both
READMEs, `llms.txt`, `CONTRACTS.md` sections 5 and 6, the privacy pages'
"Link previews" sentence, D1-D3 and D6); the full list:
`git show 8019493d:issues/ai-mcp/plan.md`, section 3.6. Still to come:

- B5b adds "and relays a connected app's account calls to Supabase with
  the reader's token" to the law sentence ("The Supabase backend is the
  only server that stores data; one stateless Worker renders link cards
  and answers the read API and the MCP endpoint, and stores nothing. Add
  no other backend, upload endpoint or paste service.") and to its copies.
- B5a changes the privacy pages again: a reader's lists, share links,
  requests, homebrew items, sources, cards and pictures reach the app or
  AI vendor the reader connects, under that party's own policy, until the
  reader disconnects it on `#/account`; both pages state the consent
  page's scope list and cascades (B5a step 6), the account's email and
  name when B5a step 1 finds them in the client token (plan-B5a-R5), and
  a global logout or the sight and revoke of the other apps when step 1
  records either (plan-B5b-1, -N4).
- The Cloudflare token's "Workers Scripts Edit": the worker stays a Pages
  Function, so the owner may remove it (`.claude/README.md`, "Preview
  host").

### 3.7 Assumptions about the host (`cloudflare-pages`)

The plan assumes the shipped state: the Pages project `daggerheart-loot`
on the free Workers plan, advanced mode `_worker.js`, `_routes.json`
routing, `env.ASSETS` reads that are not subrequests, CI deploys of `main`
only, and the site at the host root. What moves if that changes:

| Change | Effect |
|---|---|
| A custom domain | the API and MCP URLs are frozen on `pages.dev` from B1; a custom domain is added beside, never instead |
| The paid Workers plan | CPU 30 s and 10 million requests a month: the 64 KB budgets may relax, B3's fallback is not needed; no contract change |
| A move off Cloudflare | the worker code is plain `fetch` handlers; the projections are static files; `env.ASSETS` becomes a file read |
| Static requests found to cost Functions requests | the quota math of section 3.4 doubles for the app's traffic, not the API's; owner question for that day |

### 3.8 Maintaining two entry points (owner question, 2026-11-10)

Settled in D2 and shipped: one implementation of each rule (pure modules
in `app/src/lib/`, which the app imports and the worker bundles), one data
source (`data.js`), and enforcement by pinned fixtures,
`tests/contracts.js` and the parity tests. Revisit rule: if a parity test
fails twice on changes that touched one side only, or a review finds one
rule implemented twice, move that area behind the API in its own batch.
The full text: `git show 51f830de:issues/ai-mcp/plan.md`, section 3.8.

## 4. Decisions settled by this plan (to `docs/decisions/`: D1-D3 and D6 in B1, D5 in B0, D4, D8 and D9 in B2a, D10 in B3, D7 in B5a)

Written (the decision files are the record; the full drafts:
`git show 8019493d:issues/ai-mcp/plan.md`, section 4):

| Id | Batch | File under `docs/decisions/` |
|---|---|---|
| D1 | B1 | `2026-11-12-the-read-api-and-mcp-are-one-stateless.md` |
| D2 | B1 | `2026-11-12-the-app-keeps-its-logic-the-api-runs.md` |
| D3 | B1 | `2026-11-12-api-v1-is-public-read-frozen-with-a.md` |
| D5 | B0 | `2026-11-10-game-text-rights-follow-a-per-record-srd-audit.md` |
| D6 | B1 | `2026-11-12-ai-mcp-lands-on-main-in-two-squashes.md` (amended by D8) |
| D4 | B2a | `2026-11-12-the-mcp-endpoint-is-a-hand-written-dispatcher-over-the-openapi-document.md` |
| D8 | B2a | `2026-11-12-ai-mcp-lands-on-main-at-four-named-landings.md` |
| D9 | B2a | `2026-11-12-api-record-links-carry-the-card-version-of-the-app-s-links.md` |

| D10 | B3 | `2026-11-12-api-search-scans-build-time-folded-names-and-file-checks-start-at-32-kb.md` |

To write:

- D7 (B5a) "A connected app reaches only the API's account scope, which
  the database and a measured Auth stop rule bound". The scope (owner, 2026-11-12): every action the
  app's UI has on the reader's lists, share links, requests, homebrew and
  print sets, by the RPCs and table writes the app uses (section 6, "UI
  action coverage"); never sign-in, account deletion or display settings.
  A Supabase OAuth access token is a normal
  `authenticated` JWT plus `client_id` (no custom scopes; verified
  2026-11-11, `context.md`), so its holder can call PostgREST at
  `<ref>.supabase.co` directly, past the worker. The guard therefore
  lives in Postgres: a PostgREST pre-request function refuses a token
  with `client_id` on every table and RPC outside the API's list,
  restrictive policies on the other tables refuse it too (they bound
  resource embedding, which the pre-request function cannot see), and
  restrictive storage policies refuse its updates and deletes; the pre-request
  function also refuses a client token whose session a revoke ended,
  so "Disconnect" stops an unexpired token at once. The database bounds
  PostgREST, Storage and Realtime; Auth is bounded by B5a step 1's
  measurement and its stop rule (plan-B5b-1: the user endpoints and the
  OAuth consent endpoints with a client token). One grant level (the
  consent page's scope list); sync by heads, commands
  with client ids and `If-Match` (section 3.4); the worker relays only a
  token with `client_id`, keeps none, and never sees a refresh token; the
  `/me` CORS allowlist is empty until a browser client is reviewed.
  Rejected: scope enforced by the worker only (the token works without
  it); a per-client read-only level (needs a client table; Supabase has
  no custom scopes); accepting the app's own session token on the API (it
  carries the whole account, sign-in and deletion included); `*` on
  `/me`; audience binding by a custom access token hook (it would change
  the app's own tokens; one project is both the authorization server and
  the resource behind the worker); two-way replication; an
  `updated_since` cursor.

## 5. Contracts in detail (B1)

### 5.1 Common rules

Shipped in B1-B3; the contract is `docs/specs/CONTRACTS.md` section 6
(host, methods, the check order, `OPTIONS`, the answer headers, the
static catalog, path and body caps). Rules that B5 builds on: T0 paths
ignore an `Authorization` header and never forward it, and only
`/api/v1/me/` reads it (B5b); the reserved `/api/v1/me/` prefix answers
the JSON 404 and the `*` preflight in v1 only because it holds no data,
and B5b replaces both with the allowlist; every person-read text is a
pair `{ ru, en }` built by the app's own functions; error messages are
English, name a field by its schema name and never echo a value.

Errors: `{ "format": "daggerheart-loot/api-error", "version": 1, "error":
{ "code", "message" } }`.

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | a parameter or body field fails its schema; the message names the field |
| 400 | `too_broad` (B3) | a search query past 300 kept lines or 3000 anchor positions |
| 404 | `not_found` | an unknown path, section, table, part, record id, homebrew id or share token |
| 405 | `method_not_allowed` | another method; `Allow` names the allowed ones |
| 413 | `too_large` | a request body past its cap |
| 415 | `unsupported_media_type` | a `POST` body that is not `application/json` |
| 422 | `answer_too_large` | a Supabase answer past the service's 65536 B cap; the message gives the app link |
| 503 | `unavailable` | an `env.ASSETS` or Supabase read failed or was not valid JSON; a second `data_version` mismatch |

The `code` list widens in place (B5b adds 401 `unauthorized` and
`invalid_token`, 403 `forbidden`, 409 `conflict`, `limit_reached` and
`confirm_required`, 412 `precondition_failed`, 428
`precondition_required`; B5d adds 409 `short`); a code keeps its status
and meaning for good, and a client that meets a `code` it does not know
acts on the HTTP status. The full B1 text:
`git show 51f830de:issues/ai-mcp/plan.md`, section 5.1.

### 5.2 Rolls

Shipped in B1; the contract is `docs/specs/CONTRACTS.md` section 6 and the `Rolls`,
`RollBody` and `RollAnswer` schemas of `preview/api/openapi.json` (modes `std`, `alt`,
`table`, `part`; dice kinds `nd12`, `typed`, `duality`, `pick`; `bump` at the top
of a crit answer). The design text: `git show 93eac0ae:issues/ai-mcp/plan.md`, section 5.2.

### 5.3 The neutral record `daggerheart-loot/record` v1

Shipped in B1; the contract is `docs/specs/CONTRACTS.md` section 6 and the
`Record` schema of `openapi.json`, built by `app/src/lib/apiRecord.ts`.
Rules that B5 builds on: `origin` is `catalog` or `homebrew`; a homebrew
`id` is the row uuid for the row's life, and `link` is `<site>h/<uuid>`
(with `?v` since D9); `key` is the value that relation fields and list
entries hold (a catalog key equals its id; a homebrew `hb_` key never
changes and is unique within one account only); a homebrew record carries
no owner field and its `rights` is `owner`; `/api/v1/me/` answers hold
only the reader's own rows. The field table and the Charkeeper check:
`git show 51f830de:issues/ai-mcp/plan.md`, section 5.3.

### 5.4 Tables, records, homebrew items, shared lists

Shipped in B1; the contract is `docs/specs/CONTRACTS.md` section 6 and
`openapi.json` (`Tables`, `Table`, `Record`, `SharedList`, `CatalogIndex`,
`CatalogChunk`). Kept here because later batches build on them: a table
answers whole, or one tier part on the `eq_*` tables (`part` required); the
bulk catalog is static and frozen as section 11 says (chunk names, count and
grouping are not frozen); a homebrew item and a shared list are read as
`anon` under a 65536 B cap and shaped with the `withRecords` compositions of
`itemView.svelte.ts` and `SharedListPage.svelte`. The design text and the
entry-count estimates: `git show 93eac0ae:issues/ai-mcp/plan.md`, section 5.4;
the measured counts are in `.claude/README.md`, "Quotas, recovery and failure".

## 6. Batches

### B0 - License statement and per-record rights audit (done)

Outcome: shipped in the first squash `aeb68c0e` (2026-11-12) with B1: one
aligned license statement in every copy, `docs/rights/records.json` (745
records: 700 `dpcgl`, 45 `owner`; `reviewed` 2026-11-12), D5, the
`tests/derived.js` rights checks. Review `reviews/B0.md` (nits folded into
B1). The implement-ready brief: `git show 93eac0ae:issues/ai-mcp/plan.md`.

### B1 - API core and REST v1 reads (done)

Outcome: shipped in the first squash `aeb68c0e` (2026-11-12), live on
production since that deploy: `preview/api/` (service, REST adapter,
reads, `openapi.json`), `tools/api-data.mjs` (`apidata/`, the public bulk
catalog `api/v1/catalog/`), `rollTables.ts`, `apiRecord.ts`, fixtures
`docs/fixtures/api/v1/`, `CONTRACTS.md` section 6, D1, D2, D3, D6. Review
`reviews/B1.md` (fix-then-continue; fix pass `93eac0ae`). Live checks
1-11 passed on 2026-11-12 (`context.md`, "Live readings after the B1
deploy"). The brief, the "Landing mid-task" steps and the "B5
touchpoints" paragraph: `git show 93eac0ae:issues/ai-mcp/plan.md`.

### Order of the remaining batches (planner, 2026-11-13)

Done: B2a (landing 2), then B3 and B2b together (landing 3, D8). The plan
review before B5b (`reviews/plan-B5b.md`) and the UI action audit
(`reviews/audit-ui-actions.md`) are applied (Status). Remaining: B5a,
B5b, B5c and B5d on the task branch, in that order, each one commit and
one push; all four land with the closeout squash (D6, D8), and the owner
switches the production OAuth server on after it (B5a step 9).

### B2a - Record links, roll CPU and the MCP adapter (done)

Outcome: shipped at landing 2 as `89a55f1b` (B2a `22755cc1`, review
`reviews/B2a.md` fix-then-continue, fix pass `5b58edf8`; merge-back
`8019493d`), live on production: the record `link` carries the card
version (D9), the catalog chunks hold one record per line and a roll or
a record read parses one line per result, a warm isolate keeps each roll
section's index, and `POST /mcp` serves seven tools from `openapi.json`
1.1.0 in both protocol eras (D4). D8 (four landings) and the D6 pointer
are written. Local CPU (`handoff.md`, "Completed"): `std` roll warm 35 %
and cold 71 % of B1 (the cold criterion of 50 % was not met; production
decides). The brief, steps and acceptance:
`git show 8019493d:issues/ai-mcp/plan.md`.

Landing-2 readings (`context.md`, "Landing 2 readings"): 0 errors and 0
exceeded-CPU in 33 requests; the three p99 lines failed against a fixed
floor of about 3-4 ms, and the owner accepted the roll as it is (section
7). The one optional roll step: an isolate cache of each chunk's split
lines. Owner step: the Claude connector with "No sign in"; a 403 means
the client sends `Origin`, and the fallback is an allowlist constant in
`mcp.mjs` (a fixture for an allowed and a refused origin, recorded in D4).

### B3 - Search, table filters and file checks (done)

Outcome: shipped at landing 3 in `c4742c53` with B2b (review
`reviews/B3.md` fix-then-continue; its fix pass decodes the file strictly
as the app does), live on production: `GET /api/v1/records`
(`searchRecords`, `search_catalog`), `filter` on `GET
/api/v1/tables/{table}`, `POST /api/v1/file-checks` (`checkFile`,
`check_file`), `openapi.json` 1.2.0 (live `ETag` `1.2.0-1f6036b8`), the
projections `apidata/search/` and `apidata/file-check.json`, `f` on the
table rows, `facetsOf`, the report builders `lib/importReport.ts` and
`lib/homebrewReport.ts`, D10. Settled design (D10; reopen only on a
failed reading): build-time folded names in text shards of at most
262144 B with five facet codes, an `indexOf` anchor scan, `rankHits` on
names only, 400 `too_broad` past 300 kept lines or 3000 anchor positions;
the file check at a 32768 B cap with the panels' own lines in both
languages, no account (`unheld`), a lists error line by item id only, at
most 50 lines and `more` (`LINES_MAX`, a default taken (owner AFK),
`handoff.md` "Deviations"). Step 1's gate held (K = 3.01; the 3x cold
REST search predicted 9.4 ms); step 13's local numbers are in
`handoff.md`, "Verification".

Step 14 readings (orchestrator, 2026-11-13; `context.md`, "Landing 3
readings and owner instructions"): every status as expected, 0 errors and
0 exceeded-CPU counts; every burst p50 at most 8 ms (met); the cold
readings of search (12.6 ms), the homebrew check (13.8), the lists check
(10.2) and MCP `check_file` (19.5) are past the 10 ms line, and the 3x
prediction is about 14-15 ms. Open: the owner's decision; the
orchestrator recommends accepting them as the roll was (a cold reading is
the first request of an isolate after the 10-minute cache; no 1102).
Named fallbacks if the owner refuses: search (1) each display name as a
capitalization delta against its folded name, then (2) shard skipping by
the facet code sets in the index; the file check keeps 32768 B (a cap
never falls), and the Supabase Edge Function option (section 3.2) goes to
the owner. The closeout lines that B3 and B2b placed in B5b are B5d's
placed lines (1) and (3) and a closeout step (plan-B5b-N7). The brief,
steps, acceptance and standing checks:
`git show 51f830de:issues/ai-mcp/plan.md`.

### B2b - The two pages, the footer, the import links (done)

Outcome: shipped at landing 3 in `c4742c53` (B2b `ed3d8954`, review
`reviews/B2b.md` fix-then-continue, fix pass `a3448d16` with every golden
re-seeded): the static pages `pages/ai.html` and `pages/developers.html`
with their `en/` twins (`PAGES` rows), the footer links «ИИ-ассистенты» /
"AI assistants" and "API", `ImportFileRow.svelte` in both import panels
(no `/llms.txt` link left; default taken (owner AFK): the lists panel
takes the My items panel's row), the README, README.ru and `llms.txt`
links, the Russian-credit test, the two `tests/contracts.js` tests, the
five footer links in `tests/app/states.js` and the `collect-site.sh`
guard. The client steps were checked on 2026-11-13 against each client's
official page (`handoff.md`, "Verification"); ChatGPT has no block (its
help page does not say that it takes a server with no sign-in). Its two
closeout lines are now B5d placed line (3) (the file-check cap, decided at
landing 3) and the closeout's issue 72 step (plan-B5b-N7). The brief,
steps and standing checks: `git show 51f830de:issues/ai-mcp/plan.md`.

### B4 - dropped (2026-11-10)

- Was the Charkeeper mapping or `format=charkeeper-v1`; owner Q1 removes
  both, and no gate waits on the author. What remains: the field checks
  of sections 5.3 and 8, the announcement (an owner step), additive
  fields later (section 11). The id B4 is not reused.

### B5 - The account tier (refreshed 2026-11-12; four batches)

Objective (owner, chat, 2026-11-12): a reader can do through `/api/v1/me/`
and `/mcp/me` every action they can do in the app's UI on their own data,
except the named exceptions of "UI action coverage" below. A connected app
gets one grant level (Q8, D7); the database, not the worker, bounds a
client token (a client token works at PostgREST directly), and B5a step
1's stop rule bounds it on Auth (plan-B5b-1).

Facts: `context.md`, "B5 design facts (2026-11-11)" and "B5 refresh facts
(2026-11-12)". The scope of Q9 (lists, entries and homebrew items only) is
replaced by the owner's parity rule (section 7, "Defaults taken (owner
AFK), B5 refresh"). Every operation below uses an RPC or a table write the
app already uses; no operation needs a new RPC or a new table, so B5a's one
migration is the only migration of B5, and B5b-B5d change no stored shape.

Batches, split criteria and gates (`.claude/README.md`, "Batch size and the
fixed cost of a run"):

| Batch | Ships | Split criterion | Gate cost | Review trigger | Needs shipped first |
|---|---|---|---|---|---|
| B5a | connection, guard (the whole B5 scope), consent page, "Connected apps", privacy pages, D7 | a different route and filter set (an app route and screen, browser suites, goldens, `check:db`) | about 45 min (`check:fast`, `check:db`, CI with the golden re-seed) + review 15 | a migration (role config, restrictive policies, a SECURITY DEFINER helper); a public contract (the route) | B3 and B2b on `main` (landing 3) |
| B5b | the account API core (token, CORS, metadata, `/mcp/me`, paging, bulk and confirm rules) and lists: lists, entries, bulk entry edits, order, share links, a copy of a shared list, the lists file out and in | a public-contract change of its own (`/api/v1/me/` list resources, `api-my-*` list formats, fixtures, stub suites) | about 30 min (`check:fast`, CI) + review 15 | a public contract; a new write and sync protocol; possible loss of stored data (deletes, cascades) | B5a committed on the branch |
| B5c | homebrew: items (paged), sources and sections, sets and rule cards, moves, bulk delete, a copy to own items, pictures, the homebrew file out and in, a new item into a list | a public-contract change of its own (`/api/v1/me/` homebrew resources and formats) | about 30 min + review 15 | a public contract; possible loss of stored data (deletes, import overwrite, pictures) | B5b |
| B5d | purchase requests and notices (R8 over every list included), a request to another reader's list, print sets, the closeout placed lines | a public-contract change of its own (requests and print-set resources, R8 from the audit included) | about 30 min + review 15 | a public contract; a write protocol (requests change list quantities) | B5c |

Total B5 gate cost: about 3 h 40 min (B5a 60, B5b 45, B5c 45, B5d 45,
the closeout squash 23; the plan review before B5b is done). All four
land with the closeout squash (D6); the owner switches the production
OAuth server on after it (B5a step 9). The account-level `me` reads ship
in B5b (lists) and B5c (homebrew items, the reads issue 72 asked for).
Closeout steps (not a batch line; plan-B5b-N6, -N7): the orchestrator
updates live check 1's expected OpenAPI `ETag` to `1.3.0-`, and posts the
issue 72 follow-up A2 and closes the issue
(`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`) after the
closeout squash is live and the owner's production switch and probe pass
(B5a step 9).

#### UI action coverage

Stable section id for the independent audit: the orchestrator's read-only
auditor derives the action list from `app/src` without this table, then
compares. Audit done: `reviews/audit-ui-actions.md` (2026-11-13,
fix-then-continue, applied). Each gap goes to the batch of its own row,
so no batch changes an operation that another batch has shipped (default
taken (owner AFK), section 7); a gap that needs a guard name or adds a
fact to the consent list folds into B5a before B5a's commit (step 3's
list, the step 6 list, both privacy pages; plan-B5b-R5); the audit found
none. Derived 2026-11-12 from `app/src` (components, `state/*`,
`ports/supabase.ts`, `lib/cloudLists.ts`), not from `FEATURES.md` alone.
AL = `rpc/apply_list_writes` with the op named; "table" = a PostgREST
table call under RLS; every path is under `/api/v1/me`; MCP tools live on
`/mcp/me`. A row's id is its acceptance id in its batch; a line that
holds several rows has one case per row.

| Id | UI action (place) | API operation | MCP tool | Ends in | Batch |
|---|---|---|---|---|---|
| L1 | read the lists (`ListsPage`) | `GET /lists` (heads, paged) | `list_my_lists` | table `lists` (entry heads), `rpc/my_limit` | B5b |
| L2 | read a list's entries (`ListPage`) | `GET /lists/{id}` | `get_my_list` | tables `lists`, `list_entries`; `rpc/get_homebrew_items` for linked items | B5b |
| L3 | «Новый список» (index, add-to-list menu) | `POST /lists` | `create_list` | AL `create` | B5b |
| L4 | rename (the title field) | `PATCH /lists/{id}` `name` | `update_list` | table `lists` update by revision with `If-Match`, else AL `update` | B5b |
| L5 | «Цены:» money mode | `PATCH /lists/{id}` `money_mode` | `update_list` | as L4 | B5b |
| L6 | list notes, players' and GM's, «Очистить» | `PATCH /lists/{id}` `player_note`, `gm_note` | `update_list` | as L4 | B5b |
| L7 | «Удалить список» (card, page) | `DELETE /lists/{id}` | `delete_list` | table `lists` delete by revision | B5b |
| L8 | «Удалить (N)» on `#/lists` | `POST /lists/delete` | `delete_lists` | table `lists` delete, one per id | B5b |
| L9 | add to a list (`AddToList` chip, a roll result, a record, a selection bar) | `POST /lists/{id}/entries` | `add_to_list` | AL `add` | B5b |
| L10 | entry quantity, price | `PATCH /lists/{id}/entries/{entry}` | `update_list_entry` | AL `update_entry` | B5b |
| L11 | entry notes, players' and GM's | `PATCH /lists/{id}/entries/{entry}` | `update_list_entry` | AL `update_entry` | B5b |
| L12 | «Скрыть от игроков» / «Показать игрокам» (row) | `PATCH /lists/{id}/entries/{entry}` `gm_only` | `update_list_entry` | AL `update_entry` | B5b |
| L13 | «Убрать из списка», a chip toggle, and the undo | `DELETE /lists/{id}/entries/{entry}`; the undo is L9, then L14 (the place comes back) | `remove_from_list` (one entry) | AL `remove_entries` | B5b |
| L14 | position field, drag and drop | `PUT /lists/{id}/order` | `reorder_list` | AL `reorder` | B5b |
| L15 | selection «Цены»: guess, shift by percent, clear, with undo; `{ set }` and the bulk `quantity` are API additions (the UI does them one entry at a time, L10) | `PATCH /lists/{id}/entries` (`ids`, `price`; `If-Match` on a shift) | `update_list_entries` | AL `update_entry`, one per row, in one call | B5b |
| L16 | selection «Скрыть от игроков (N)» / «Показать игрокам (N)» | `PATCH /lists/{id}/entries` (`ids`, `gm_only`) | `update_list_entries` | AL `update_entry`, one per row | B5b |
| L17 | selection «Удалить (N)», a part of a row's quantity included | `POST /lists/{id}/entries/delete` (`entries`: id and optional `quantity`; `If-Match` on a part quantity) | `remove_from_list` (`entries`: id and optional `quantity`, as the REST body) | AL `update_entry` or `remove_entries` | B5b |
| L18 | «Скачать JSON» (card, page, selection) | `GET /lists/file?ids=` | `export_lists` | tables `lists`, `list_entries`; `lib/bundle.ts` export | B5b |
| L19 | «Импорт из файла» (lists panel, the ZIP's `lists.json`) | `POST /imports` (lists) | `import_file` | `rpc/import_homebrew` (snapshot copies), then `rpc/import_lists` | B5b |
| S1 | open «Поделиться» (reads the links) | `GET /lists/{id}/shares` | `list_share_links` | table `list_shares` | B5b |
| S2 | «Создать ссылку»; the panel's first open makes the missing links | `POST /lists/{id}/shares` (`audience`) | `create_share_link` | `rpc/create_list_share` | B5b |
| S3 | «Удалить ссылку» | `DELETE /share-links/{id}` | `revoke_share_link` | `rpc/revoke_list_share` | B5b |
| S4 | replace a link (an owner requirement, chat, 2026-11-12; in the UI, S3 then S2) | `POST /lists/{id}/shares` (`audience`, `replaces`) | `replace_share_link` | `rpc/revoke_list_share`, then `rpc/create_list_share` | B5b |
| S5 | «Сохранить себе» on `#/s/` | `POST /lists/copies` (`token`) | `save_shared_list` | `rpc/clone_shared_list` | B5b |
| H1 | read own homebrew (`HomebrewPage`) | `GET /homebrew-items` (paged), `GET /homebrew-sources`, `GET /homebrew-cards` | `list_my_homebrew_items`, `list_my_sources`, `list_my_cards` | tables `homebrew_items`, `homebrew_books`, `homebrew_cards`; `rpc/my_limit` | B5c |
| H2 | read one own item | `GET /homebrew-items/{id}` | `get_my_homebrew_item` | `rpc/get_homebrew_item`, table `homebrew_items` | B5c |
| H3 | «Новый предмет», «Сохранить» | `PUT /homebrew-items/{id}` `If-None-Match: *` | `save_homebrew_item` | table `homebrew_items` upsert | B5c |
| H4 | edit, «Сохранить» | `PUT /homebrew-items/{id}` `If-Match: "<rev>"` | `save_homebrew_item` | table `homebrew_items` update by revision | B5c |
| H5 | conflict «Сохранить мою версию» | `PUT /homebrew-items/{id}` `If-Match: *` | `save_homebrew_item` (`overwrite`) | table `homebrew_items` update, no revision | B5c |
| H6 | gone «Сохранить как новый» | H3 with a new id | `save_homebrew_item` | as H3 | B5c |
| H7 | «Удалить» (editor) | `DELETE /homebrew-items/{id}` | `delete_homebrew_item` | table `homebrew_items` delete | B5c |
| H8 | bulk «Удалить» | `POST /homebrew-items/delete` | `delete_homebrew_items` | `rpc/delete_homebrew_items` | B5c |
| H9 | bulk «Переместить (N)»; the editor's source and section fields | `POST /homebrew-items/move`; the fields in H4 | `move_homebrew_items` | `rpc/move_homebrew_items` | B5c |
| H10 | craft links («Создаётся из», «Создаёт»), the upgrade line («Новая линия», same-type rungs) | the item's `content` in H3-H5 | `save_homebrew_item` | as H3-H5 | B5c |
| H11 | picture «Выбрать файл» and crop, «Заменить», «Обрезать заново» | `PUT /homebrew-items/{id}/picture` (two WebP files) | none (REST only, named) | Storage upload x2, table `homebrew_items` `art` | B5c |
| H12 | «Убрать картинку» | `DELETE /homebrew-items/{id}/picture` | `clear_item_picture` | table `homebrew_items` `art` null | B5c |
| H13 | «Выбрать из предметов» (reuse a picture) | `PUT /homebrew-items/{id}/picture` (`from`) | `set_item_picture` | table `homebrew_items` `art` | B5c |
| H14 | «Новый источник» (tab, editor's «+ Новый источник...») | `PUT /homebrew-sources/{id}` `If-None-Match: *` | `save_homebrew_source` | table `homebrew_books` upsert | B5c |
| H15 | «Переименовать» a source | `PUT /homebrew-sources/{id}` `If-Match` | `save_homebrew_source` | table `homebrew_books` update by revision | B5c |
| H16 | sections: new, rename, delete (and the editor's «+ Новый раздел...») | `PUT /homebrew-sources/{id}` (`content.sections`) | `save_homebrew_source` | as H15 | B5c |
| H17 | delete a source (its items move to the default source) | `DELETE /homebrew-sources/{id}` | `delete_homebrew_source` | table `homebrew_books` delete | B5c |
| H18 | «Новый комплект», «Новая карта правил» | `PUT /homebrew-cards/{id}` `If-None-Match: *` | `save_homebrew_card` | table `homebrew_cards` upsert | B5c |
| H19 | edit a card | `PUT /homebrew-cards/{id}` `If-Match` | `save_homebrew_card` | table `homebrew_cards` update by revision | B5c |
| H20 | delete a card | `DELETE /homebrew-cards/{id}` | `delete_homebrew_card` | table `homebrew_cards` delete | B5c |
| H21 | «Добавить предмет» to a card: an own item (its `set` or `refs`), a catalog item (the card's `items`); a move from another set; member «Убрать» and its undo | H4 on the item, or H19 on the card | `add_card_member`, `remove_card_member` | table `homebrew_items` or `homebrew_cards` update | B5c |
| H22 | «Скачать JSON» (bulk, a source, «Хоумбрю») | `GET /homebrew/file?items=` or `?source=` or all, paged | `export_homebrew` | tables `homebrew_*`; `lib/bundle.ts` export | B5c |
| H23 | «Импорт из файла» (homebrew panel, the ZIP's `homebrew.json`), «Куда» per file source, «Обновить» | `POST /imports` (homebrew, `targets`) | `import_file` | `rpc/import_homebrew` | B5c |
| H24 | «Сохранить себе» of a catalog record or another account's item | `POST /homebrew-items/copies` (`from`) | `save_item_copy` | `rpc/import_homebrew`, Storage copy, table `homebrew_items` `art`, AL `relink` per list | B5c |
| H25 | «Добавить свой предмет» on a list | `POST /lists/{id}/entries` with `new_item` | `add_new_item_to_list` | table `homebrew_items` upsert, then AL `add` | B5c |
| R1 | read requests and notices (`RequestsPanel`) | `GET /lists/{id}/requests` | `list_requests` | tables `purchase_requests`, `purchase_request_lines`, `list_notices` | B5d |
| R2 | «Принять» | `POST /requests/{id}/accept` | `accept_request` | `rpc/apply_purchase_request` (`p_clamp` false) | B5d |
| R3 | «Принять доступное» | `POST /requests/{id}/accept` (`clamp: true`) | `accept_request` (`clamp`) | `rpc/apply_purchase_request` (`p_clamp` true) | B5d |
| R4 | «Отклонить» | `POST /requests/{id}/decline` | `decline_request` | `rpc/decline_purchase_request` | B5d |
| R5 | mark read (automatic on a shown panel) | `POST /lists/{id}/read` | `mark_list_read` | `rpc/mark_list_read` | B5d |
| R6 | notice «Скрыть», «Скрыть изменения» | `POST /notices/delete` | `hide_notices` | table `list_notices` delete | B5d |
| R7 | «Сообщить владельцу» on `#/s/`, flow b's send | `POST /shared-lists/{token}/requests` | `send_request` | `rpc/create_purchase_request` | B5d |
| R8 | the new requests and notices of every list («Новое в списке (N)» on each `ListsPage` card, the tab title count) | `GET /requests` (pending heads over every list, paged; `unread_notices` per list) | `list_my_requests` | tables `purchase_requests`, `list_notices` | B5d |
| P1 | «Печать» (list page, `PickRow`, selection bars) | `POST /print-sets` (`cards` or `list_id`) | `create_print_set` | `rpc/create_print_set` | B5d |

Cross-reference (audit N5): reading a shared list `#/s/<token>` before S5
or R7 is the public tier's `GET /api/v1/shared-lists/{token}` and
`get_shared_list` (B1), which `/mcp/me` also lists (B5b step 3).

Exceptions (no API operation; each with its reason; the auditor checks
this list too):

- X1 Sign-in, «Подключить», «Отключить» a provider, «Выйти», «Выйти на
  всех устройствах»: B5a's stop rule; a connected app never changes how
  the reader signs in.
- X2 «Удалить аккаунт»: a connected app never deletes the account (D7;
  `rpc/delete_account` and `rpc/delete_account_requests` stay refused).
- X3 The Display section, the start-section pin, «Когда беру из чужого
  списка» and flow b's remembered answer (`user_prefs`): stored in the
  account, read only by the app's screens; a client sends a request only
  by R7, so the remembered flow b answer has no effect on it;
  `user_prefs` stays refused, and the B5a probe reads it.
- X4 The print page `/p/<id>`, «Напечатать», «Ссылка на набор» and the
  print switches: the fit is measured in a browser and the worker stores
  nothing; P1 answers the app link `<site>p/<id>` where the reader prints
  (owner, 2026-11-12). `rpc/get_print_set` stays refused.
- X5 Clipboard, Web Share and file-save controls («Скопировать текст»,
  «Скопировать ссылку», the picture PNG copy, «Поделиться» of a record):
  local; the answers carry each `link`, and L18, H22 carry the files.
- X6 «Скачать мои данные (ZIP)»: the ZIP is the two files of L18 and H22
  packed in the browser; the API serves the two files, never a ZIP, and
  `POST /imports` takes each file, never a ZIP.
- X7 The list roll «Бросить по списку»: a local pick from the entries; a
  client picks from `get_my_list`.
- X8 Selection ticks, filters and search on the app's pages, view
  switches, toasts and focus: local screen state.
- X9 The crop dialog: a picture arrives already cropped (H11 takes the
  two files the app makes); MCP has no picture upload, because a tool body
  is capped at 65536 B (`/mcp`) and a picture pair at 409600 B.
- X10 Realtime topics and the sync buffer's retries: a client polls the
  heads (section 3.4) and retries by the rules of "Common rules".
- X11 The share panel's first open makes the missing links by itself: the
  API makes a link only on S2.
- X12 «Скрыть» of decided requests: memory only.
- X13 `rpc/reorder_list` and `rpc/move_legacy_list`: granted to
  `authenticated`, used by no screen (the app reorders with AL `reorder`);
  both stay refused.

#### Common rules of the account API (B5b; B5c and B5d follow them)

- Token: the worker decodes the payload without a signature check
  (PostgREST verifies it) and refuses before any read: none, 401
  `unauthorized` with `WWW-Authenticate: Bearer
  resource_metadata="<site>.well-known/oauth-protected-resource/api/v1/me"`;
  not a JWT, another `iss` or a past `exp`, the same with
  `error="invalid_token"`; no `client_id`, 403 `forbidden` (the app's own
  session token is refused, Q10). It forwards the token with the
  publishable `apikey`; a PostgREST 401 is 401 `invalid_token`, the
  guard's 42501 is 403 `forbidden`. It never logs, caches by or echoes the
  token; refresh is the client's. `aud` is not checked (D7).
- The service: `/me` operations take `op(input, ctx)` with `ctx.token`;
  `rpc` and a PostgREST table helper take the token; T0 operations stay as
  B1 wrote them.
- CORS on `/me`: `ME_ORIGINS` in `rest.mjs`, empty. A listed `Origin` is
  echoed with `Vary: Origin`, methods `GET, POST, PUT, PATCH, DELETE,
  OPTIONS`, headers `Authorization, Content-Type, If-Match,
  If-None-Match`, `Access-Control-Expose-Headers: ETag, WWW-Authenticate`,
  `Max-Age` 86400, no credentials; any other `Origin` gets no
  `Access-Control-*` header. Reason (placed, plan-B1-2-N5): a bearer token
  is not ambient, so cross-site request forgery does not apply; a browser
  client keeps a token that reads, changes and deletes a whole account in
  page script, where any script on that page can take it. The allowlist
  makes each browser client a reviewed decision (one deploy and a
  `CONTRACTS.md` line). Answers: `Cache-Control: private, no-store`,
  `nosniff`, the CSP `sandbox`.
- Paging (owner, 2026-11-12): every collection read (`GET /lists`, `GET
  /homebrew-items`, `GET /homebrew-sources`, `GET /homebrew-cards`, `GET
  /lists/{id}/requests`) takes `limit` (1-100, default 100) and `cursor`
  (opaque, a keyset after the last id in id order) and answers `next`
  (null on the last page). A client reads every page before it treats an
  id it holds and no page answered as deleted (section 3.4, "Sync").
- Answers of writes: an item write answers `api-my-item` (`id`, `key`,
  `rev`, `updated_at`, `link`, `record` v1); a source or card write answers
  its head (`id`, `key` where the row has one, `rev`, `updated_at`); a
  list write answers `api-my-list` (`link` is the owner's page
  `<site>lists/<id>`; the share links of S1 are the links others open). An
  item's `link` is the record v1 link of `CONTRACTS.md` section 6,
  `<site>h/<uuid>?v=<v>`: an own item is unlisted, not secret (`CONTRACTS.md`,
  `#/h/<uuid>`), so an item that is in no shared list still has this link,
  and anyone who holds it reads the item (owner question, 2026-11-12).
- Bulk (owner, 2026-11-12): one operation takes an array; the cap is 100
  per call (a list's entry limit, the item limit); a body cap of 32768 B,
  65536 B for an import body (the file inside it at most 32768 B, below).
  Partial failure follows the app's RPC: AL
  answers one result per op (`results`: `ok`, `gone`, `limit`,
  `refused`), as the app reads them, and the worker adds `skipped` for a
  row that the app's function leaves alone (L15); `rpc/delete_homebrew_items`,
  `rpc/move_homebrew_items`, `rpc/import_homebrew` and `rpc/import_lists`
  are all or nothing. CPU: 100 ops are at most about 20 KB of JSON, under
  0.1 ms to build locally; the call's cost is its one subrequest.
- Subrequests (plan-B5b-R8): the free plan allows 50 subrequests a
  request; an operation makes at most 20. The AL ops of one call go in one
  `apply_list_writes` request (H24's `relink` for every list in one call);
  L8's loop of at most 10 deletes is the largest loop.
- Stop before delete: a call that can delete more than one row (L8, L17,
  H8, R6) takes `confirm`, equal to the number of ids (or `entries`) in the
  call, not the rows a cascade or a part quantity touches, else 409
  `confirm_required` with that number; a retry with the same body and
  `confirm` answers each gone id as deleted (plan-B5b-N2). A call of one
  id or one entry takes no `confirm`. L8 deletes at most 10 lists a call
  (each list cascades); H8 at most 100 items. Every delete tool has
  `destructiveHint`, and its description tells the assistant to show the
  reader the names and the cascade and to ask first.
- Stop before overwrite: an import that rewrites rows the reader holds
  (H23 `mode: "update"`) takes `expect_overwrites`, equal to the dry run's
  count, else 409 `confirm_required` with the count and nothing written.
  A lists import never overwrites (`rpc/import_lists` adds only the
  missing entries of a list id the caller holds).
- Imports (`POST /imports`): `{ file, import_id?, mode?, targets?,
  dry_run?, expect_overwrites? }`, `file` the file text as one string (as
  `check_file`). The worker detects the format as B3's file check does,
  parses it with `parseBundle` or `parseHomebrew` (the only validator),
  builds the rows as the app's import builds them, and with `dry_run`
  answers B3's `api-file-check` report plus `would_create` and
  `would_overwrite`; without it, it applies and answers the counts, the
  app's line texts and `import_id`.
  - Retry (audit B1): `import_id` is an optional UUID; the service makes
    one when it is missing and answers it. Every id the import makes is a
    UUIDv5 with `import_id` as the namespace and the row's place in the
    file as the name: `list:<list index>` for a list id,
    `entry:<list index>:<entry index>` for an entry id, `copy:<file key>`
    for the uuid behind a homebrew copy (its key in the app's key form
    from that uuid), `source:<file source key>` for a new source id. So
    the same file with the same `import_id` sends the same ids, and
    `rpc/import_lists` and `rpc/import_homebrew` read them as a retry.
  - Context and order (plan-B5b-R8): for a lists file the worker first
    reads what `importPlan(lists, account)` needs (`lists` `id,name`;
    `homebrew_items` `id,key`), then calls `rpc/import_homebrew` for the
    snapshot copies, then `rpc/import_lists`, as `app.svelte.ts`
    `importLists` does; a failed lists call keeps the copies, and a retry
    skips their held keys and links them (the app's retry rule).
  - Cap (plan-B5b-4, decided at landing 3): the file at most 32768 B, B3's
    file-check cap, with no condition. Landing 3 measured the 32 KB file
    check alone at 10.2 ms cold (lists, about 2000 unknown ids) and 13.8 ms
    cold (homebrew), MCP `check_file` at 19.5 ms cold, burst p50 2.4-5.9 ms
    and p99 9.5-20.6 ms, with no 1102 and no exceeded-CPU count
    (`context.md`, "Landing 3 readings and owner instructions"). An import
    adds the row build and one to three subrequests, so its cold cost is
    in the class of those readings (about 10-20 ms cold); the owner's
    decision on the landing-3 cold readings decides for the import too
    (if the owner refuses them, the import waits for the file-check
    fallback). A larger file is split by the client (each list on its
    own; homebrew items with the sources and cards they name) or imported
    in the app.
- Exports (plan-B5b-4): the app's own file (`daggerheart-loot/lists` with
  the version the app writes; `daggerheart-loot/homebrew`), built by the
  app's export function in `lib/bundle.ts`. A page holds whole lists or
  whole items up to 32768 B and answers `next`; a single list past 32768 B
  answers 422 `answer_too_large` with the app link (as a shared list). The
  page size rises only after a production reading (a cap may rise, never
  fall; section 11): a 64 KB page parses about twice what the 32 KB file
  check parses, which landing 3 read at 10-14 ms cold.

#### B5a - The account connection (implement-ready)

Objective: a reader connects an app or AI assistant through the Supabase
OAuth 2.1 server on a consent page at `/connect`, sees and disconnects it
on `#/account`, and the database bounds every client token to the scope of
the "UI action coverage" table; D7.

In scope: the measurements of step 1, `supabase/config.toml`'s OAuth
server section, the guard migration for the whole B5 scope, the port, the
route and page, the account section, the privacy pages, `FEATURES.md`,
`ROUTES.md`, `META.md`, D7, `.claude/README.md`, the bundle budget. Out
of scope: every `/api/v1/me/` operation (B5b-B5d).

Audit fold-in (plan-B5b-R5): `reviews/audit-ui-actions.md` found no gap
that needs a guard name or adds a fact to the consent list (R8 reads
`purchase_requests` and `list_notices`, both on step 3's list; the import
targets and the bulk guess are covered by the scope lines of step 6). So
step 3's list, the step 6 list and the privacy pages take no audit row.

Approved mock (default taken (owner AFK), recommended layout):
`issues/ai-mcp/mocks/b5a-screens.html` (screens `consent` and `apps`, a
state, RU/EN and 360/1180 px switch; PNGs in `issues/ai-mcp/mocks/png/`).
Constraints the implementer follows:

- Consent: `PageTitle` «Подключение приложения» / "Connect an app" in
  every state but the expired one; the sub «Приложение просит доступ к
  вашему аккаунту на этом сайте.» / "An app asks for access to your
  account on this site."; one primary `Panel` at the passage measure
  (`--measure-text`) holding, in this order: the client name (`--t-title`,
  700, `overflow-wrap: anywhere`) and «После ответа вы вернётесь на %s» /
  "After your answer you go back to %s" with the redirect host; a `Field`
  «Аккаунт» / "Account" with the account page's session line (email in
  bold, provider logo, «через %s»); a `Field` «Приложение сможет» / "The
  app can" with the scope list (step 5) and the cascade line as a hint; a
  `Field` «Не сможет» / "It cannot" with one line; «Разрешить» (primary)
  and «Отказать» (ghost) in one `row-btns` at the bottom of the card;
  then the hint «Отключить приложение можно на странице «Аккаунт», в
  разделе «Подключённые приложения».» / "You can disconnect the app on
  the "Account" page, in "Connected apps"." No client logo is drawn (a
  third-party image on an account page; default taken (owner AFK)).
- "Connected apps": a `Panel` with the `Field` heading «Подключённые
  приложения» / "Connected apps" right after «Способы входа» in the left
  column (one column below 1000 px). A row is the providers' row shape
  (`.ids li`): the name in bold, a small line «<host> · подключено <date>»
  / "<host> · connected <date>" (the date in the interface language, long
  form), and a ghost small «Отключить» / "Disconnect" button labelled
  «Отключить <name>»; rows newest first. Empty: one muted line
  «Приложений нет. Здесь появятся те, кому вы разрешите доступ.» / "No
  apps. The apps you allow show up here.".
- Departures from the sibling, named: a provider's «Отключить» has no
  confirm (the reader connects it again in the app); an app's has the
  browser confirm, because a revoke cannot be written back (rule 10).

Steps:

1. Measure on the test project (the owner switched "OAuth Server" on
   2026-11-12: authorization path `/connect`, dynamic apps on; the Site URL
   stays `http://localhost:3000`, owned by `supabase/config.toml`
   `[remotes.test.auth]`; only the owner runs `npm run config:push`, which
   needs a TTY). Run the flow in Node with a seeded test account: register
   a client dynamically, call the authorize URL and read its redirect's
   `Location` without loading it (it names
   `http://localhost:3000/connect?authorization_id=...`), then
   `getAuthorizationDetails`, `approveAuthorization` with
   `skipBrowserRedirect` and the token exchange through auth-js 2.117.1 in
   Node. Record: the token's claims (`email`, `phone`, `app_metadata`,
   `user_metadata` with the provider name and picture; plan-B5a-R5);
   whether a `resource` parameter is accepted and changes `aud`; whether
   PostgREST accepts the access token after `revokeGrant` until `exp`; what
   the client token can do on Auth: `PUT /auth/v1/user` (email; password;
   `data`), `GET /auth/v1/user/identities/authorize`, `DELETE
   /auth/v1/user/identities/{id}`, `POST /auth/v1/factors`, `POST
   /auth/v1/logout?scope=global`, `GET /auth/v1/user`; the OAuth
   endpoints with the client token (plan-B5b-1): `GET` of an
   authorization's details, its approve (the consent `POST`),
   `listGrants` and `revokeGrant` (the paths auth-js 2.117.1 calls for
   `auth.oauth`); which of
   `<SUPABASE_URL>/.well-known/oauth-authorization-server/auth/v1` and
   `<SUPABASE_URL>/auth/v1/.well-known/oauth-authorization-server`
   answer; the shapes auth-js answers (`client.name`, `client.uri`,
   `client.logo_uri`, `redirect_uri`, `user.email`; a grant's `client`,
   `scopes`, `granted_at`), and whether a grant answer carries the
   client's redirect URIs (plan-B5b-R4); the shape of `authorization_id`
   (its characters and length, for step 6's check); whether the token
   endpoint accepts `grant_type=client_credentials` for a dynamically
   registered client, and the claims of such a token (plan-B5b-R7; a
   token with no session must be refused, step 3); and what `listGrants`
   answers while the server is off (switch it off for one call only if
   the owner already did; else read it on the local stack with the
   section off). Stop rule: if a client token changes the email or the
   password, links or unlinks an identity, enrolls a factor, or approves
   an authorization (a connected app could connect another app that
   survives its revoke), stop and return to the owner (a connected app
   could take or lock the account). Recorded, not a stop: a global logout
   and a `data` change (if possible, both privacy pages name the global
   logout, and the «Не сможет» line stays as written; plan-B5b-N4); a
   client token that lists or revokes grants (then both privacy pages name
   that a connected app can see and disconnect the other apps). This is
   B5's one owner stop. Results go to `.claude/README.md`, "Supabase
   configuration".
2. `supabase/config.toml` owns the OAuth server (plan-B5a-R6: the CLI
   2.117.0 template held `[auth.oauth_server]`, deleted as not owned, so
   a later `config:push` leaves the dashboard switch as it is; owning it
   makes the push the switch). Read the field names with `npm run
   config:diff -- --project test` (enabled, the authorization path, dynamic
   registration). The base section (production and the local stack):
   enabled, path `/connect`, dynamic registration on; `[remotes.test.auth]`
   gets the same. `config:diff -- --project test` then prints `drift:
   none`. The production value takes effect only when the owner runs
   `config:push -- --project prod` after the closeout squash (step 9), so
   the switch follows the migration and the route. If the pinned CLI has no
   such section, record that and keep the dashboard switch (step 9).
3. Migration `supabase/migrations/<date>_api_client_guard.sql`:
   `public.api_client_guard()` (invoker), set by `alter role authenticator
   set pgrst.db_pre_request` and `notify pgrst, 'reload config'`, with
   `grant execute on function public.api_client_guard() to anon,
   authenticated, service_role`. With `auth.jwt() ->> 'client_id'` not
   null it first refuses a token whose session ended:
   `public.api_client_session_live()`, SECURITY DEFINER, `set search_path
   = public, pg_temp`, `revoke execute ... from public, anon`, `grant
   execute ... to authenticated`, answers whether the token's
   `session_id` has a row in `auth.sessions` (plan-B5a-R1). It takes no
   argument: it reads `auth.jwt() ->> 'session_id'` itself, so it is no
   oracle for other sessions; a missing or malformed `session_id` answers
   false, never a cast error (plan-B5b-N1). So a token with `client_id`
   and no `session_id`, or one whose session has no row (a
   `client_credentials` token if step 1 finds one), is refused
   (plan-B5b-R7). Then it allows
   only these (by `request.method`, `HEAD` judged as `GET`, and
   `request.path` by exact equality):
   - `GET`: `lists`, `list_entries`, `list_shares`, `purchase_requests`,
     `purchase_request_lines`, `list_notices`, `homebrew_items`,
     `homebrew_books`, `homebrew_cards`;
   - `POST`: `homebrew_items`, `homebrew_books`, `homebrew_cards`;
   - `PATCH`: `lists`, `homebrew_items`, `homebrew_books`,
     `homebrew_cards`;
   - `DELETE`: `lists`, `list_notices`, `homebrew_items`,
     `homebrew_books`, `homebrew_cards`;
   - `POST` on `rpc/` + each of: `apply_list_writes`, `import_lists`,
     `my_limit`, `get_homebrew_items`, `get_homebrew_item`,
     `create_list_share`, `revoke_list_share`, `clone_shared_list`,
     `create_purchase_request`, `apply_purchase_request`,
     `decline_purchase_request`, `mark_list_read`, `import_homebrew`,
     `move_homebrew_items`, `delete_homebrew_items`, `create_print_set`;
   else it raises 42501 `api_client_guard: not allowed for a connected
   app`. The list is the "UI action coverage" table's "Ends in" column;
   a later batch that needs another name changes this function in a new
   migration and is a plan-review trigger. Restrictive policies on every
   `public` table outside the `GET` list that `authenticated` can select
   (`user_prefs`, `print_sets` and every other one the step 4 query
   finds): `create policy <table>_no_client as restrictive for all to
   authenticated using ((select auth.jwt() ->> 'client_id') is null) with
   check ((select auth.jwt() ->> 'client_id') is null)`. Restrictive
   policies on `storage.objects` refuse a client token's update and
   delete: one `for update` and one `for delete`, never `for all` (a
   restrictive `for all` also refuses H11's insert); an insert stays under
   `homebrew_art_insert` (H11 uploads pictures). They stay although no
   permissive update or delete policy exists today
   (`20261014120000_homebrew_art.sql`: only the database deletes, through
   `pg_net` and a Vault key), so they guard against a later one
   (plan-B5b-N3). The
   reversal `supabase/reversals/<same name>.sql` (`alter role authenticator
   reset pgrst.db_pre_request; notify pgrst, 'reload config';`, drop the
   policies, drop both functions) runs under the up-down-up gate of
   `check:db`. Named fallback, if the probe shows that the hosted project
   refuses or ignores the role setting: a guard call at the top of each
   RPC `authenticated` may execute that is outside the list (the
   restrictive table policies already bound the tables).
4. `tests/db/api-client-guard.test.mjs`: it enumerates every table and
   function `authenticated` can reach (`pg_class`, `pg_proc` grants) and
   asserts that a client token is refused on each one outside step 3's
   list, and on storage update and delete; it asserts each allowed row of
   the list answers for a client token as for an app token (one case per
   row); an embedding case from each allowed table to each out-of-scope
   table it has a foreign-key path to answers empty embedded arrays or 403
   for a client token, and the full rows for an app token; a revoked
   grant's unexpired token is refused; a client token with no
   `session_id`, with a malformed one, or with one that has no
   `auth.sessions` row is refused, and `api_client_session_live()` answers
   false for it with no error (plan-B5b-N1, -R7); a client token reads and writes its
   own rows and never another account's; `rpc/delete_account`,
   `rpc/delete_account_requests`, `rpc/get_print_set`, `rpc/reorder_list`,
   `rpc/move_legacy_list` and `user_prefs` are refused; an app token and
   `anon` behave as before (the existing suites pass unchanged); a deleted
   account leaves no grant. Client tokens: if the local CLI stack serves
   the OAuth server, from the flow; else minted (a JWT with `client_id`
   and a `session_id` whose `auth.sessions` row the test inserts, signed
   with the local JWT secret).
5. Ports: an `AppRepository` in `ports/types.ts` (`details(id)`,
   `approve(id)`, `deny(id)`, `list()`, `revoke(clientId)`; `list()`
   answers `{ ok: true; apps: AppGrant[] } | { ok: true; off: true } | {
   ok: false }`, `off` for the answer step 1 recorded for a server that
   is off), in `ports/supabase.ts` over `auth.oauth` of auth-js 2.117.1
   (`getAuthorizationDetails`, `approveAuthorization` and
   `denyAuthorization` with `skipBrowserRedirect`, then
   `location.assign` of the answered URL; `listGrants`; `revokeGrant`),
   the fake in `fake-cloud.ts` with seeded grants and one pending
   authorization, `cloud.contract.ts` cases. `AppGrant`: `clientId`,
   `name`, `host`, `grantedAt`. `host` is the redirect URI's host when the
   grant answer carries the redirect URIs (step 1 records it), else
   `client.uri`'s host (plan-B5b-R4): with dynamic registration the name
   and `client.uri` are whatever the app wrote, and the redirect is where
   the code goes. The consent card's «вы вернётесь на %s» and the row's
   host line show the same field. A redirect that is not `https` (a
   loopback port or a custom scheme of a desktop client) shows its scheme
   and host as given (`cursor://...`, `127.0.0.1`), built by one helper in
   `lib/` with a unit test. If step 1 finds no answer that tells "off" from a failure,
   `list()` has no `off` arm, and step 9's order switches production on
   before the closeout deploy.
6. Route `#/connect/<id>` (`/connect/<id>`, `/en/connect/<id>`; `ROUTES.md`,
   fixtures `docs/fixtures/urls/routes.json` and
   `docs/fixtures/urls/paths.json` get the rows). On entry,
   `/connect?authorization_id=<id>` (and `//connect`, which production's
   `site_url` with its final `/` can make, and `/en/connect`) becomes the
   route key `#/connect/<id>`, and the bar is rewritten to the path form of
   that key (`/connect/<id>`, `/en/connect/<id>`). Every later rewrite
   (the language rewrite of `I18N.md`), the sign-in return record
   (`ports/redirect.ts` `saveReturn`, `dhloot.auth.return`, which stores
   the route key) and a reload then carry the id with no new mechanism
   (plan-B5b-2). The rewrite writes the normalized path, never
   `location.pathname` as given (`replaceState` reads a path that starts
   with `//` as a host). The id is checked by the shape that step 1
   records; another shape, or no id, draws the expired page.
   `preview/public/_redirects` gets `/connect / 200`, `/connect/* / 200`,
   `/en/connect /en/ 200` and `/en/connect/* /en/ 200` in the order of the
   file's other app routes (`tests/contracts.js` fails without them).
   Framing (plan-B5b-R3): `preview/public/_headers` adds `/connect`,
   `/connect/*`, `/en/connect` and `/en/connect/*` with
   `Content-Security-Policy: frame-ancestors 'none'` and `X-Frame-Options:
   DENY`; the page draws the expired page, with no buttons, when
   `window.top !== window` (it also covers `//connect` if Pages applies no
   `_headers` rule to it); one `check-site` probe of the two headers and
   one component test. A build with no sign-in draws the not-found page.
   The page draws the mock's states (Standing check
   1); «Разрешить» and «Отказать» go to the URL the approve or deny
   answers; an authorization that is already approved redirects with no
   draw. The scope list (RU, then EN, the same facts; mock strings):
   «читать, менять и удалять ваши списки, их позиции и ссылки на них,
   отвечать на запросы игроков;» «читать, менять и удалять ваши предметы,
   источники, комплекты и карты правил, загружать и убирать их картинки;»
   «сохранять себе чужие списки по ссылке и отправлять их владельцам
   запросы;» «импортировать и скачивать ваши файлы списков и предметов,
   создавать наборы для печати.»; the cascade hint «Удаление списка
   закрывает его ссылки и запросы игроков по нему; удаление предмета
   убирает его из всех списков, где он есть, и удаляет его картинку.
   Вернуть удалённое нельзя.»; «Не сможет»: «менять ваш вход, удалять
   аккаунт и менять настройки отображения.» English: "read, change and
   delete your lists, their entries and share links, and answer players'
   requests;" "read, change and delete your items, sources, sets and rule
   cards, and upload or remove their pictures;" "save copies of shared
   lists and send requests to their owners;" "import and download your
   list and item files, and make print sets."; "Deleting a list also ends
   its share links and the players' requests on it; deleting an item
   removes it from every list that holds it and deletes its picture. A
   deletion cannot be undone."; "change how you sign in, delete your
   account or change your display settings." If step 1 finds `email` or a
   name in the client token, the list adds «видеть почту и имя вашего
   аккаунта.» / "see your account's email and name." (plan-B5a-R5).
7. `#/account`: "Connected apps" by the mock: loading (`LoadState`), a
   failed read (`LoadState` small, «Не получилось загрузить подключённые
   приложения.» / "Could not load the connected apps.", «Повторить»),
   empty, rows; `off` draws no section. «Отключить» asks the browser's
   confirm «Отключить «%s»? Приложение больше не сможет читать и менять
   ваши данные на этом сайте. Подключить его снова можно только из самого
   приложения.» / "Disconnect "%s"? The app can no longer read or change
   your data on this site. You can connect it again only from the app.";
   «Отмена» changes nothing; a revoke that succeeds removes the row and
   toasts «Приложение «%s» отключено» / "App "%s" disconnected"; focus
   moves by rule 20 (the next row's «Отключить», the one before, the
   section's heading is no target, so `#main`); a failed revoke keeps the
   row and toasts `accountFailed`. The page's buttons are disabled while a
   revoke runs, as the page's other actions.
8. Privacy pages (both): the B5a sentence of section 3.6 with the same
   facts as the step 6 scope list and cascade (and the email and name when
   step 1 finds them; a global logout, and that a connected app can see
   and disconnect the other apps, when step 1 records either), one new
   "Last changed" date. `FEATURES.md`
   "Account" (the section, its states, the confirm, the toast) and a new
   "Connect an app" part; `ROUTES.md` (`#/connect/<id>`, `/connect/<id>`,
   and the entry form `/connect?authorization_id=<id>`); `META.md` section 3
   (the OAuth server, the guard, the scope); D7 rewritten to the parity
   scope with its exceptions; `node tools/decisions.js`.
9. `.claude/README.md`, "Supabase configuration": step 1's results, the
   owned `[auth.oauth_server]` (or the fact that `config:push` leaves the
   dashboard switch), and the production order (owner, after the closeout
   squash: the migration applied by CI, `/connect` live, then `npm run
   config:diff -- --project prod`, which must show only `auth.oauth_server`
   rows (plan-B5b-N8), then `npm run config:push -- --project prod`, which
   switches the server on; then the
   owner runs the acceptance probe on production and opens the consent
   URL once to see that `//connect` reads as `/connect`). "Restore
   production (owner)" gains a step that re-applies the role setting and
   runs the probe: the nightly backup leaves out roles
   (`.github/workflows/backup.yml`), so a restore drops
   `pgrst.db_pre_request` with no error. Revert order: switch the OAuth
   server off (or revoke every grant) before the down migration, which
   would give client tokens the whole account back. Before the closeout
   squash the orchestrator reads production's
   `/auth/v1/.well-known/oauth-authorization-server` (or the form step 1
   found) to confirm that the server is still off (plan-B5b-N8).
10. Bundle budget (plan-B5b-R1): `check:fast` read 275.2 of 276 kB after
    B2b, and `tools/bundle-budget.mjs` sums every `.js` and `.css` under
    `dist/`, so a lazy chunk does not avoid the limit. B5a adds the
    consent page, the account section, their strings in both languages
    (the unconfigured 276 kB limit) and `AppRepository` in
    `ports/supabase.ts` (the configured 333 kB limit, about 1 kB of room).
    Raise each limit that the batch passes to the measured total rounded
    up to the next whole kB, in the same commit (`.claude/README.md`, "The
    configured bundle budget"; ceilings 300 and 350); run that section's
    configured line, because the batch changes `ports/supabase.ts`; load
    the consent page as its own chunk if the router already splits a
    route.

Acceptance (each line its own check):

1. Step 1's results are in `.claude/README.md`, "Supabase configuration",
   and its stop rule did not fire.
2. `config:diff -- --project test` prints `drift: none` with the owned
   OAuth server section (or the README records that the CLI has none).
3. The guard allows each row of step 3's list for a client token (one
   `tests/db` case per row) and refuses everything else `authenticated`
   reaches (the enumeration case).
4. Embedding from an allowed table to an out-of-scope one is refused for a
   client token and answers for an app token (test).
5. A revoked grant's unexpired token is refused (test).
6. Storage: a client token's update and delete are refused; its insert
   under `homebrew_art_insert` answers as the app's (test).
7. `rpc/delete_account`, `rpc/delete_account_requests`,
   `rpc/get_print_set` and `user_prefs` are refused for a client token
   (test).
8. Up-down-up of the migration passes `check:db`.
9. After `migrate-test` applies the migration, a client token from step 1
   gets 403 `api_client_guard` from `GET /rest/v1/user_prefs?limit=1` on
   the test project, and an app token gets 200 (recorded in `.claude/README.md`).
   The previous probe on `print_sets` was defective: `print_sets` grants
   nothing to `authenticated`, so an app token got 403 there too.
10. `AppRepository` cases of `cloud.contract.ts` pass on the fake and the
    real port.
11. `/connect?authorization_id=<id>`, `//connect?authorization_id=<id>`
    and `/en/connect?authorization_id=<id>` resolve to `#/connect/<id>`
    with the bar at `/connect/<id>` or `/en/connect/<id>`; the route
    fixtures and `_redirects` carry `/connect`, `/connect/*`,
    `/en/connect` and `/en/connect/*`; `tests/contracts.js` passes.
12. Each consent state of Standing check 1 is a `tests/app/inventory.js`
    entry with a golden at 360 and 1180 px.
13. Each "Connected apps" state of Standing check 1 is an inventory entry
    with a golden; `off` draws no section (a component test).
14. The disconnect confirm, «Отмена», the row's removal, the toast, the
    focus and the failure toast each have a component test.
15. Component tests end with `expectNoA11yViolations`.
16. Every new string is in `dict.ts` in both languages with the same
    facts (`i18n.test.ts` case for the scope list and the cascade).
17. Both privacy pages carry the scope facts and a new date; `FEATURES.md`,
    `ROUTES.md`, `META.md` and D7 are updated; `node tools/decisions.js`
    ran.
18. The placed line of plan-B1-2-N5 is answered in B5b (its CORS bullet,
    "Common rules").
19. Signed out on `/connect?authorization_id=<id>`, a sign-in returns to
    the consent card of the same id (a `redirect.test.ts` case and a
    component test); an English reader's bar rewrite keeps the id
    (plan-B5b-2).
20. `npm run budget` passes in both builds, with any raise and its
    measured totals in the same commit (plan-B5b-R1).
21. `/connect/*` and `/en/connect/*` answer `frame-ancestors 'none'` and
    `X-Frame-Options: DENY` (a `check-site` probe); a framed page draws
    the expired page with no buttons (a component test; plan-B5b-R3).
22. A client token with no live session (no `session_id`, a malformed
    one, or no `auth.sessions` row) is refused (a `tests/db` case;
    plan-B5b-N1, -R7); step 1 records the `client_credentials` answer.

Standing checks:

1. Scale (States; proof: goldens at 360 and 1180 px, component tests):

   | State | Screen | Proof |
   |---|---|---|
   | consent loading | title, «Загружаем...» | golden |
   | consent details | the card of the mock | golden |
   | consent with email and name | one more scope line | golden (only if step 1 finds them) |
   | consent approving | buttons disabled, «Разрешаем...» | component test |
   | consent failed read | title, load line, primary «Повторить» | golden |
   | consent failed approve or deny | the card, error toast | component test |
   | consent signed out | lead and the sign-in panel; the sign-in returns to the same `#/connect/<id>` | golden; `redirect.test.ts` and a component test |
   | consent expired, no, unknown or malformed id, or a framed page | error page «Запрос на подключение устарел» | golden; component test (framed) |
   | consent with a non-https redirect | «вы вернётесь на» `cursor://...` or `127.0.0.1:<port>` as given | component test, unit test of the helper |
   | consent already approved | redirect, no draw | component test |
   | the longest client name (200 characters) | wraps in the card | golden at 360 |
   | apps loading, failed read, empty | the section's line | goldens |
   | apps one, many (30 rows in the test) | rows newest first | golden (one), component test (30) |
   | apps longest name | wraps in its row | golden at 360 |
   | apps row host: the redirect host, else `client.uri`'s; a non-https redirect as given | the host line | component test |
   | apps off | no section | component test |
   | apps revoke failure | row kept, toast | component test |

   No limit row exists for grants. The primary action stays at the bottom
   of the consent card; nothing is sticky; the page has no input, so no
   keyboard case.
2. Errors: a failed read shows its retry and stores nothing; a failed
   approve or deny keeps the page and toasts; offline is a failed read; a
   grant revoked in another tab leaves on the next read of the section; a
   stale tab (the previous bundle) has no `/connect` and draws the
   not-found page, and a reload fixes it; a frontend revert draws the same,
   so the owner switches the server off first (step 9); the down
   migration follows step 9's order. No stored data is lost: a revoke ends
   the sessions and refresh tokens, never rows, and the guard refuses the
   app's unexpired access token on its next request (step 3). The guard
   widens what a client token may write (the whole parity scope), so the
   losses of B5b-B5d are possible from B5a's ship on, through PostgREST
   directly; they are named in each batch and in the consent text.
3. Consistency (`FEATURES.md`, "Consistency rules"): rule 2 (the account
   page's `accountFailed` departure for the revoke; the load line «Не
   получилось загрузить подключённые приложения.»), rule 5 (the delete
   form for «отключено»), rule 6 (`LoadState`), rule 7 (the heading in
   every state; the error page for an expired request), rule 10 (the
   browser confirm, no undo), rule 14, rule 16 (long names wrap), rule 20
   (focus). Sibling: «Способы входа» - the same panel, heading and row
   shape; named difference: the provider's «Отключить» has no confirm.
4. RU/EN parity: every string of steps 6 and 7 in `dict.ts` in both
   languages; both privacy pages; the scope list names the same facts in
   both languages: what the app reads, changes and deletes, the two
   cascades, the four things it never does (and the email and name, a
   global logout and the sight and revoke of other apps when step 1
   records them: both privacy pages, the same facts); a host as given
   (`cursor://...`) is shown untranslated in both; `/connect`, which Supabase sends without `/en/`,
   opens in the stored language (`I18N.md`).

Review: required (a migration; a public contract - the route).

#### B5b - The account API core and lists (implement-ready)

Objective: `/api/v1/me/` and `/mcp/me` with the common rules, and every
list row of "UI action coverage" (L1-L19, S1-S5) as an operation and a
tool, relaying a connected app's token.

Predecessor: B5a committed on the branch (the guard and the route).
In scope: the rows named, the common rules, `openapi.json` 1.3.0 (the
`/me` operations so far), fixtures, `CONTRACTS.md` section 6, `llms.txt`
(how to connect; the sync rule), the law sentence of section 3.6 in
`CLAUDE.md` and its copies, `check-site`. Out of scope: homebrew rows
(B5c), requests and print sets (B5d).

Operations (shapes; `/me` is short for `/api/v1/me`):

| Operation | Rule |
|---|---|
| `GET /me/lists` | heads `{ id, rev, name, entries, updated_at, link }` (`api-my-lists`), paged; `limits: { lists, entries }` from `rpc/my_limit` |
| `POST /me/lists` | `{ id?, name, money_mode?, player_note?, gm_note?, entries? }` (entries as L9, at most 100); the service makes a missing `id` and answers it; 201; the same id again 200; another account's id 409 `conflict`; past the limit 409 `limit_reached` |
| `GET /me/lists/{id}` | `api-my-list`: the list fields, `rev`, `link`, and `entries` (`id`, `key`, `origin`, `record_id`, `quantity`, `price_coins`, `player_note`, `gm_note`, `gm_only`, in list order); `ETag: "<rev>"`; each Supabase answer it reads (the list with its entries, the linked items) through `readText` with a cap of 65536 B, past it 422 `answer_too_large` with the app link, as `get_shared_list` (plan-B5b-4) |
| `PATCH /me/lists/{id}` | `name`, `money_mode`, `player_note`, `gm_note`; optional `If-Match`: a direct `lists` update with `eq('revision', r)` and the read-back rule of `homebrewUpdate` (412 with the current `ETag`); without it, AL `update`, last writer wins, as the app |
| `DELETE /me/lists/{id}` | `If-Match` required (428 without); 204; gone 204; moved 412; cascades as section 3.4 names |
| `POST /me/lists/delete` | `{ ids (1-10), confirm }`; each deleted as the app loops (no revision); `results` per id; `confirm` rule |
| `POST /me/lists/{id}/entries` | `{ entries: [{ id?, record_id, quantity?, price_coins?, player_note?, gm_note?, gm_only? }] }`, 1-100; AL `add` as `lib/cloudLists.ts` builds it (a homebrew `record_id` links that item); a retry is idempotent by entry id |
| `PATCH /me/lists/{id}/entries/{entry}` | the entry fields; AL `update_entry`; last writer wins |
| `PATCH /me/lists/{id}/entries` | `{ ids (1-100), quantity?, gm_only?, price? }`; `price` is `{ guess: true }` (each entry to its own guessed price, `lib/money.ts` `guessPrice` with the catalog's rarity; an entry with no guess is `skipped`), `{ raise_percent }` or `{ discount_percent }` (`reprice`, -90..500 as the sheet allows, priced entries only), `{ clear: true }` (priced entries only), or `{ set }` (an API addition); an unpriced entry is `skipped` by a shift and by a clear; one AL call with one `update_entry` per row; `results` per id. A body with `raise_percent` or `discount_percent` requires `If-Match: "<list rev>"` (428 `precondition_required` without); the worker compares it with the revision it reads before it computes, else 412 with the current `ETag`, and writes nothing (plan-B5b-3); `guess`, `clear`, `set`, `quantity` and `gm_only` are absolute and take no `If-Match` |
| `DELETE /me/lists/{id}/entries/{entry}` | AL `remove_entries` (+ `reorder` as the app sends it); a gone entry 204 |
| `POST /me/lists/{id}/entries/delete` | `{ entries: [{ id, quantity? }] (1-100), confirm }` (`confirm` is the number of entries, a lowered row included; one entry takes none); a `quantity` below the row's takes that many (AL `update_entry`), else the row goes (AL `remove_entries`), as the selection's «Удалить (N)»; a body with a `quantity` below its row's requires `If-Match: "<list rev>"` (428 without, 412 when stale, nothing written; plan-B5b-3); whole-row deletes take none |
| `PUT /me/lists/{id}/order` | `{ ids }`, every entry id of the list once; AL `reorder`; another set of ids 409 `conflict` with the current order |
| `GET /me/lists/file` | `?ids=` (1-10) or none for all, paged by 32768 B; the app's lists file (`format`, `version` as the app writes them) and `skipped`: per list, the count of entries left out because their own item is gone and they link no record (`app.exportLists`, `#bundle` `skipped`; audit R7) |
| `POST /me/imports` | the "Imports" rule (`import_id`, the context reads, the retry rule); a lists file adds lists, never overwrites; its homebrew snapshots go first through `rpc/import_homebrew`, as `app.importLists` does |
| `GET /me/lists/{id}/shares` | `{ id, audience, created_at, revoked_at, link }`, stopped ones too; `link` is the preview link `<site>s/<token>?v=<v>` the share panel copies (`v` by the app's own function) |
| `POST /me/lists/{id}/shares` | `{ audience: "player" \| "gm", replaces? }`; without `replaces`, the audience's active share or a new one (`rpc/create_list_share`; a retry answers the same); with `replaces`, that share is stopped first (`rpc/revoke_list_share`; a stopped one stays stopped), then the active one or a new one; 200 or 201 |
| `DELETE /me/share-links/{id}` | `rpc/revoke_list_share`; 204; a stopped one 204 |
| `POST /me/lists/copies` | `{ token, id? }`; `rpc/clone_shared_list`; a second call with the same id copies nothing and answers 200 |
| `GET /.well-known/oauth-protected-resource/api/v1/me` and `.../mcp/me` | RFC 9728: `resource`, `authorization_servers: ["<SUPABASE_URL>/auth/v1"]`, `bearer_methods_supported: ["header"]`, `resource_documentation`; CORS `*`; `public, max-age=3600` |

Steps:

1. `preview/api/me.mjs` (new): the token check, the PostgREST and RPC
   helpers that take the token, paging, the `confirm` rule, the bulk
   result shape. `rest.mjs` routes `/api/v1/me/` to it, with `ME_ORIGINS`
   and the CORS rule; `_routes.json` adds
   `/.well-known/oauth-protected-resource/*`.
2. `preview/api/me-lists.mjs` (new): the list operations of the table,
   building every AL op with `lib/cloudLists.ts` (the app's shapes, never
   a second copy) and every file with `lib/bundle.ts`.
3. `preview/api/mcp.mjs`: `/mcp/me`, B2's dispatcher listing every
   `x-mcp-tool` operation of `/me`; a request without a valid client token
   is HTTP 401 with the `WWW-Authenticate` above; the `Origin` 403 holds;
   tools of the coverage table's MCP column for B5b, then the public tools
   of `/mcp` after the account tools, answered as on `/mcp` (they ignore
   the token; plan-B5b-R2: Claude Free holds one custom connector, and L9,
   S5 and R7 need `search_catalog`, `get_record` and `get_shared_list`);
   `remove_from_list` takes `entries` (id and optional `quantity`, as the
   REST body of L17; one entry is L13; audit R3); an omitted `id` is
   made and returned; `destructiveHint` on `delete_list`, `delete_lists`,
   `remove_from_list`, `revoke_share_link`, `replace_share_link`; the
   descriptions of the delete tools name their cascades and the `confirm`
   rule; descriptions mark notes as data.
4. `openapi.json` 1.3.0, the one bump of B5 (B5c and B5d add their
   operations to 1.3.0, because no B5 batch lands alone, D6;
   plan-B5b-N6): `components.securitySchemes.supabaseOAuth`
   (`oauth2`, `authorizationCode`, the production URLs, `scopes: {}`,
   "discover them from the protected-resource metadata"), `security` on
   each `/me` operation, the error codes `unauthorized`, `invalid_token`,
   `forbidden`, `conflict`, `limit_reached`, `precondition_failed`,
   `precondition_required`, `confirm_required` (section 5.1), the sync
   fair use and what an account `rev` covers (section 3.4).
5. Fixtures `docs/fixtures/api/v1/me-*.json` and
   `docs/fixtures/mcp/me-*.json`; `tests/contracts.js`; `CONTRACTS.md`
   section 6 (the `/me` list operations, the common rules); `llms.txt`;
   `check-site` (`/api/v1/me/lists` 401 with `WWW-Authenticate`, both
   metadata documents 200).
6. Stub tests (`preview/api/me.test.mjs`, `me-lists.test.mjs`): one case
   per acceptance line below.

Acceptance (each line its own check; a stub test unless named):

1. No token 401 with `WWW-Authenticate`; a malformed, foreign-`iss` or
   expired token 401 `invalid_token`; an app session token 403; a guard
   42501 is 403; no answer or error holds the token.
2. CORS: a listed `Origin` echoed with `Vary`; another gets no
   `Access-Control-*` header; `OPTIONS` answers the methods and headers.
3. Paging: `limit`, `cursor`, `next` on `GET /me/lists`; a cursor past the
   end answers an empty page with `next` null.
4. L1 `GET /me/lists`: heads and limits.
5. L2 `GET /me/lists/{id}`: fields, entries in order, `ETag`; another
   account's id 404; a Supabase answer past 65536 B is 422
   `answer_too_large` with the app link (plan-B5b-4).
6. L3 `POST /me/lists`: 201; same id 200; another account's id 409; past
   the limit 409 `limit_reached`; with entries.
7. L4-L6 `PATCH /me/lists/{id}` without `If-Match` (AL `update`) and with
   a current and a stale `If-Match` (200, 412 with the current `ETag`);
   one case per row (L4 `name`, L5 `money_mode`, L6 both notes).
8. L7 `DELETE /me/lists/{id}`: 428 without `If-Match`; 204; gone 204;
   moved 412.
9. L8 `POST /me/lists/delete`: `confirm` missing or wrong 409
   `confirm_required` and nothing deleted; 11 ids 400; per-id results.
10. L9 add: 100 entries pass, 101 is 400; a retry with the same entry ids
    adds nothing twice; a homebrew `record_id` links the item.
11. L10-L12 one-entry `PATCH`: one case per row (L10 quantity and price,
    L11 notes, L12 `gm_only`); a gone entry is `gone`.
12. L13 one-entry `DELETE`: 204, gone 204.
13. L14 `PUT /me/lists/{id}/order`: the new order; a wrong id set 409.
14. L15 bulk price: each of `guess`, `set`, `clear`, `raise_percent`,
    `discount_percent` gives the app's own numbers (`guessPrice` and
    `reprice` of `lib/money.ts`); an unpriced entry is `skipped` by a shift
    and by a clear, an entry with no guess by `guess`; a stale or missing
    `If-Match` on a shift is 412 or 428 and writes nothing (plan-B5b-3).
15. L16 bulk `gm_only`: per-id results.
16. L17 bulk delete: a part quantity and a whole row; `confirm` is the
    number of entries, a lowered row included; a stale or missing
    `If-Match` on a part quantity is 412 or 428 and writes nothing
    (plan-B5b-3); MCP `remove_from_list` with a part quantity lowers the
    row (audit R3).
17. L18 `GET /me/lists/file`: the app's file for 1 and 10 ids;
    `parseBundle` reads it back with no error; paging at 32768 B; a list
    past 32768 B 422 with the app link; an entry with no record is counted
    in `skipped` (audit R7).
18. L19 lists import: a dry run reports and writes nothing; an apply
    creates the lists and answers `import_id`; a second apply with the
    same `import_id` adds nothing (audit B1); a held list id adds only
    missing entries; a failed `import_lists` after the copies, then a
    retry, links the copies and makes none twice (plan-B5b-R8); a file of
    32769 B is 413; a ZIP is 400.
19. S1 shares read: stopped ones included; `link` equals the share panel's
    copied link for the same token and `v`.
20. S2 create: an active one answers the same; after a revoke a new one.
21. S3 revoke: 204; again 204.
22. S4 replace: the named share is stopped and a new one answers; a retry
    with the same `replaces` makes no second new share.
23. S5 copy of a shared list: 201; the same id again 200, nothing copied
    twice; an unknown token 404.
24. Metadata documents: both 200 with the RFC 9728 fields and CORS `*`.
25. `/mcp/me`: `initialize` without a token 401; `tools/list` holds the
    B5b tools, then every public tool (plan-B5b-R2); `/mcp` lists no
    account tool; each B5b tool calls its operation (one case each); a
    public tool on `/mcp/me` answers as on `/mcp`; the delete tools carry
    `destructiveHint`.
26. `openapi.json` 1.3.0 lists every B5b operation with `security`;
    `tests/contracts.js` matches `CONTRACTS.md` section 6.
27. `llms.txt`, `CLAUDE.md`'s law sentence and its copies, `check-site`:
    updated (`tests/derived.js` and `check:built` pass).
28. The live `ETag` check (`1.3.0-`) is a closeout step, not this batch's
    (plan-B5b-N6; section 6, "B5").

Standing checks:

1. Scale: no screen. Heads at the limits: lists 50 (150 at 3x), entries
   100 a list (300 at 3x), one page of 100 heads; a lists file page at
   32768 B; a bulk call at 100 ids, 101 refused; L8 at 10 lists, 11
   refused. L2 at the limits: 100 entries with `player_note` and `gm_note`
   of 4000 characters each are about 1.6 MB of Cyrillic UTF-8 plus the
   linked items (`20260925130100_lists.sql`; B1 read 43-71 ms for a 1.7 MB
   answer), so the 65536 B read cap answers 422 with the app link before
   any parse (plan-B5b-4); a list of 100 entries with short notes answers.
   A list past 32768 B answers 422 on the lists file.
2. Errors: a failed write is 503 and the retry converges (a create by its
   id; an update by the row read again; a delete by 204; a share by
   `replaces`; an import by `import_id`); a relative bulk edit (L15 shift,
   L17 part quantity) converges by its required `If-Match`: a retry after
   a success meets 412 and re-reads (plan-B5b-3). The window left: a write
   between the worker's read of the revision and its AL call is not seen,
   as in the app. A conflict is 412 with the current `ETag`; a deleted list
   is 404 on a read and 204 on a delete; the app's open tab gets the
   Realtime message that the API's write fires, as from another tab
   (`STATE.md`); a stale client meets only added fields; a revert of B5b
   answers `/me` with the JSON 404 again and keeps every row. Possible
   loss, each named in the tool descriptions: a list delete is permanent
   and also deletes its share links, the players' requests and its
   notices; a bulk delete through the API removes up to 10 lists or 100
   entries after `confirm`, but at PostgREST a client token can delete
   every list in one call, so the consent text names that a deletion
   cannot be undone (plan-B5b-N5); a revoked or replaced share link stops for everyone who
   holds it; last writer wins on an entry `PATCH` and a list `PATCH`
   without `If-Match`. These are the app's own semantics; no copy is
   kept, and the reader's recovery is a lists file saved before (L18).
   A plan-review trigger (Status).
3. Consistency: the app's semantics (limits, ids, the AL shapes, last
   writer wins, the read-back rule, the share link and its `v`); resource
   names as the app's tabs; one error code set (section 5.1).
4. RU/EN parity: records and file-check lines are pairs; error messages
   and `openapi.json` are English.

Review: required (a public contract; the write protocol; possible loss).

#### B5c - Homebrew through the API (implement-ready)

Objective: every homebrew row of "UI action coverage" (H1-H25) as an
operation and a tool. Predecessor: B5b (the core and `/mcp/me`).

Operations: `GET /me/homebrew-items` (heads `{ id, key, rev, updated_at,
link }`, paged; `?ids=` 1-10 own ids adds `records`, built from
`rpc/get_homebrew_items` with one index over the answer, every one as
`linked`, so `craft.from` holds only the keys in that answer - the named
difference of N10; an id outside the reader's heads is 400);
`GET /me/homebrew-items/{id}` (`api-my-item`: `id`, `key`, `rev`,
`updated_at`, `link`, `book`, `content`, `record`, the record built as
`GET /api/v1/homebrew-items/{id}` builds it); `PUT /me/homebrew-items/{id}`
(`{ book, content, key? }`; `content` is checked by `contentProblems` of
`lib/homebrew.ts`, then by the editor-level checks of
`lib/homebrewForm.ts` `formProblems` that need no draft (an upgrade line
whose rungs are another type, from the catalog index's `rungs`; a source
or section name held already; more than `SECTIONS_MAX` sections), then by
the database (audit R6); `key` made by the service on a
create; `art` never written by this operation, so a replace keeps the
picture; `If-None-Match: *` creates (201; an equal row 200; another row
412; a duplicate key 409; another account's id 409); `If-Match: "<rev>"`
replaces by `homebrewUpdate`'s rule; `If-Match: *` overwrites whatever
revision (H5); neither 428; body cap 32768 B); `DELETE
/me/homebrew-items/{id}` (`If-Match` required; cascades as section 3.4);
`POST /me/homebrew-items/delete` (`{ ids 1-100, confirm }`,
`rpc/delete_homebrew_items`, all or none); `POST /me/homebrew-items/move`
(`{ items: [{ id, rev }] 1-100, source, section }`,
`rpc/move_homebrew_items`, all or none, a moved revision 412 for the
whole call); `PUT /me/homebrew-items/{id}/picture` (multipart `full` and
`thumb`, each WebP, each at most `ART_BYTES_MAX` 204800 B, the RIFF
`WEBP` header read for the sizes the app writes (`ART_FULL` 640,
`ART_THUMB` 160); named and uploaded as `lib/art.ts` names them; then
`setArt`; a refused picture room is 409 `limit_reached`; or JSON `{ from
}` reusing another record's picture as «Выбрать из предметов»);
`DELETE /me/homebrew-items/{id}/picture` (`art` null); `POST
/me/homebrew-items/copies` (`{ from, id? }`, a catalog id or another
account's item id; the composite of `app.saveItem`: `rpc/import_homebrew`
copy rows, the picture copy, `setArt`, one AL call with a `relink` for
each own list that links the source item; a retry by the same `id`
converges); `GET`, `PUT`, `DELETE /me/homebrew-sources[/{id}]` (sections
inside `content`, checked by `lib/homebrew.ts` and the held-name and
section checks of `formProblems`; a delete moves its items to the default
source, as the database does); `GET`, `PUT`, `DELETE
/me/homebrew-cards[/{id}]` (a set or a rule card; its kind never changes;
`If-Match` rules as items; `REFS_MAX` and `CARD_ITEMS_MAX` checked as
`HomebrewCards.svelte` checks them); `GET /me/homebrew/file` (`?items=`,
`?source=`, or all, paged by 32768 B (plan-B5b-4); the app's homebrew
file); `POST /me/imports` for a homebrew file (`mode` `add` or `update`;
the stop-before-overwrite rule; `import_id` as "Common rules"; `targets`,
optional (audit R4): a map from a file source key (or `""` for the items
with no source) to `"home"`, `{ held: <id> }`, `"new"`, `{ file: <key> }`
or `{ custom: <name>, lang }`, as `lib/homebrewFile.ts` `Target`; a
missing key takes `defaultTarget`; the dry run answers the targets it
applies); `POST /me/lists/{id}/entries` with `new_item: { name,
description? }` (H25: the quick item's composite, an item in «Хоумбрю»,
then AL `add`; a retry by the item id makes no second item; refused
before any write at the entry limit, as `QuickItem.svelte`). MCP tools:
the coverage table's MCP column for B5c. `add_card_member` and
`remove_card_member` write the item's `set` or `refs`, or the card's
`items`, as the Sets and Rules tabs do, by `If-Match` on the row they
change. `add_card_member` of a catalog item that another own set holds
answers 409 `conflict` naming that set unless `move: true`; with it, it
writes the old card first, then this one, as `HomebrewCards.svelte`
`addBook`; a failed second write answers 503 with the first write applied,
and a retry converges (audit R5).

Files expected:
- new `preview/api/me-homebrew.mjs` (the operations above; every item
  shape through `lib/homebrew.ts`, `lib/homebrewForm.ts`, `lib/art.ts`,
  `lib/homebrewFile.ts` and `lib/bundle.ts`, never a second copy)
- `preview/api/me.mjs`: the multipart reader for H11, with a body cap of
  2 x 204800 B plus 4096 B for the part headers and boundaries (413696
  B), checked from `Content-Length` and while reading, before any parse
- `preview/api/rest.mjs` (the routes), `preview/api/mcp.mjs` (the B5c
  tools), `preview/api/openapi.json` (the B5c operations added to 1.3.0)
- new `preview/api/me-homebrew.test.mjs`
- `docs/fixtures/api/v1/me-homebrew-*.json`,
  `docs/fixtures/mcp/me-homebrew-*.json`, `tests/contracts.js`
- `docs/specs/CONTRACTS.md` section 6, `llms.txt`, `docs/specs/COVERAGE.md`
  (the new files)

Steps:
1. `me.mjs`: the multipart reader (the two parts by name, each part's
   bytes as given; 413 past the cap; 400 for a missing part or another
   media type).
2. `me-homebrew.mjs`: the item, source and card operations of the list
   above, in the coverage table's order; the picture operations; the copy
   composite (H24) with at most 20 subrequests ("Common rules"); the
   homebrew import with `targets` and `import_id`; H25 in
   `me-lists.mjs`'s add path (the `new_item` branch calls
   `me-homebrew.mjs`).
3. `rest.mjs` routes and `mcp.mjs` tools (`destructiveHint` on
   `delete_homebrew_item`, `delete_homebrew_items`,
   `delete_homebrew_source`, `delete_homebrew_card`, `clear_item_picture`;
   no picture-upload tool, X9).
4. `openapi.json`, the fixtures, `CONTRACTS.md` section 6 and `llms.txt`.
5. `me-homebrew.test.mjs`: one case per acceptance line below.

CPU: H11 passes a body of up to about 410 KB to Storage as two uploads
(two subrequests); the worker reads only the 30-byte RIFF and VP8 headers
of each part for the format and size check and never decodes or copies
the picture, so its CPU is the read of the body, not a parse.

Acceptance (each line its own check; a stub test unless named):

1. H1 heads with `link`, paging, `?ids=` (10 pass, 11 and a foreign id 400).
2. H2 one item: `record` equals the T0 record of the same id.
3. H3 create: 201; an equal row 200; another row 412; a duplicate key 409;
   another account's id 409.
4. H4 replace: 200; a stale `If-Match` 412 with the current `ETag`; gone 404.
5. H5 `If-Match: *` overwrites; neither header 428.
6. H6 a new id after a gone row creates.
7. H7 delete: 428, 204, gone 204, 412.
8. H8 bulk delete: `confirm` rule; all or none; 101 ids 400.
9. H9 bulk move: all or none; a stale revision 412; the editor's source
   and section through H4.
10. H10 craft links and the upgrade line: checked by `contentProblems` and
    `formProblems`; a bad key 422 with the validator's text pair; rungs of
    another type 422 (audit R6).
11. H11 picture upload: two WebP files pass; a wrong header 400; a wrong
    size 400; a part of 204801 B 413; a body past 413696 B 413 before any
    parse; a refused picture room 409.
12. H12 picture clear: `art` null.
13. H13 picture reuse: the other record's picture name is written.
14. H14 source create, H15 rename, H16 section add, rename and delete: one
    case per row; a held name and a section past `SECTIONS_MAX` 422.
15. H17 source delete: its items move to the default source.
16. H18 card create (a set, a rule card), H19 edit, H20 delete: one case
    per row; a kind change 400; `REFS_MAX` and `CARD_ITEMS_MAX` refused.
17. H21 card members: an own item, a catalog item, a move from another
    set without `move: true` 409 `conflict`, with it the old card written
    first, a failed second write 503 with the first applied, a removal
    (audit R5).
18. H22 export: the app's file; `parseHomebrew` reads it back; paging at
    32768 B.
19. H23 import: a dry run writes nothing and answers its targets; `add`;
    `update` without `expect_overwrites` 409 and nothing written; with it,
    the rows rewritten; a `custom` target makes one new source; a `held`
    target puts the items there (audit R4); a second apply with the same
    `import_id` of a file with a `custom` target adds nothing (audit B1).
20. H24 copy to own items: a catalog record; another account's item with a
    picture; the reader's lists relinked in one AL call; a retry converges.
21. H25 a new item into a list: the item and the entry; a retry makes no
    second item; at the entry limit nothing is written.
22. `/mcp/me` lists every B5c tool and each calls its operation; no
    picture-upload tool (X9); the delete tools carry `destructiveHint`.
23. `openapi.json` 1.3.0 holds the B5c operations; the fixtures,
    `CONTRACTS.md` section 6 and `llms.txt` match.

Standing checks: 1. Scale: no screen; items 100 (300 at 3x, heads about
50 KB on 3 pages), sources and cards at their limits from `rpc/my_limit`;
a bulk call 100, 101 refused; a homebrew file page at 32768 B; a picture
body at 413696 B, one byte past refused. 2. Errors: as B5b; possible loss,
named in the tools and the consent text: an item delete removes it from
every list that links it, other accounts' lists included (they get a
notice), and deletes its picture; a bulk delete of up to 100 items after
`confirm`; an import in `update` mode rewrites the held items after
`expect_overwrites`; H5 overwrites another device's version; a picture
clear or replace deletes the old picture; a source delete moves its items
to the default source; a card move whose second write fails leaves the
item in no own set until the retry (503 says so). Recovery: a homebrew
file saved before (H22). A plan-review trigger. 3. Consistency: the app's
validator and editor checks; the read-back rule; one `rev` rule; the
import targets of the homebrew panel. 4. RU/EN parity: records and the
validator's lines are pairs.

Deviations to name at implementation: an editor check that stays app-only
(a check that needs the editor's draft state) is listed here by the
implementer with its reason (audit R6).

Gate cost about 30 min (`check:fast`, CI). Review: required (a public
contract; possible loss).

#### B5d - Requests, print sets and the closeout lines (implement-ready)

Objective: the R and P rows of "UI action coverage" (R8 from the audit
included) and the closeout's placed lines. Predecessor: B5c. The audit is
applied (each of its other rows is in B5b or B5c); a planner pass before
B5d runs only if B5b or B5c changes a shared rule, and a plan review only
if a later gap row needs a guard name (plan-B5b-R6; none does today).

Operations: `GET /me/lists/{id}/requests` (heads and lines, keyset pages
as the app reads them, and the list's notices); `GET /me/requests` (R8,
audit R1: pending heads `{ id, list_id, created_at, read_at, expires_at,
expired }` over every list, paged by the common rule, an expired request
flagged; `unread_notices`: `{ list_id, count }` per list, as
`RequestRepository.list()` and `notices()` with no list read them for
`ListsPage.svelte` `waiting`); `POST /me/requests/{id}/accept` (`{ clamp?
}`; `rpc/apply_purchase_request`; a `short` answer is 409 `short` with
what is available, and `clamp: true` takes what is available, as «Принять
доступное»); `POST /me/requests/{id}/decline`; `POST
/me/lists/{id}/read`; `POST /me/notices/delete` (`{ ids 1-100, confirm
}`); `POST /me/shared-lists/{token}/requests` (`{ id?, lines }`,
`rpc/create_purchase_request`, a replay by `id` is safe; a list the
reader owns is 409 `conflict` before the RPC, because the app hides the
send there, `requestToken` null when `view.mine`; default taken (owner
AFK), audit N6); `POST /me/print-sets` (`{ cards: [{ id, count? }] }`
1-180, a catalog id or a homebrew item id, as `create_print_set` takes `k`
or `h`; or `{ list_id }`, built from the list as «Печать» builds it; an
unknown catalog id 400; `limit_reached` 409; 201 with `<site>p/<id>`).
MCP tools of the coverage table's R and P rows.

Files expected:
- new `preview/api/me-requests.mjs` (R1-R8) and `preview/api/me-print.mjs`
  (P1), with `me-requests.test.mjs` and `me-print.test.mjs`
- `app/src/lib/` for the print builder of `{ list_id }` if it lives in a
  component or a state file today (moved, not copied; the app calls the
  moved function; plan-B5b-N9)
- `preview/api/rest.mjs`, `preview/api/mcp.mjs`, `preview/api/openapi.json`
  (the B5d operations added to 1.3.0)
- `docs/fixtures/api/v1/me-requests-*.json`, `me-print-*.json`,
  `docs/fixtures/mcp/me-requests-*.json`, `tests/contracts.js`
- `docs/specs/CONTRACTS.md` section 6, `llms.txt`, `docs/specs/COVERAGE.md`
- `pages/src/ai.html`, `pages/src/en/ai.html`, `pages/src/developers.html`,
  `pages/src/en/developers.html` (placed line 2), the export-flow link
  (placed line 1: the components that draw «Скачать JSON» and «Скачать мои
  данные», `dict.ts` in both languages, their tests and goldens)

Steps:
1. `me-requests.mjs`: the R rows in the coverage table's order, through
   the RPCs and table reads the app uses (`ports/supabase.ts`).
2. `me-print.mjs`: P1 from `cards` and from `list_id` (the print builder
   moved to `lib/` first if needed, plan-B5b-N9).
3. `rest.mjs` routes and `mcp.mjs` tools (`destructiveHint` on
   `hide_notices`).
4. `openapi.json`, the fixtures, `CONTRACTS.md` section 6, `llms.txt`.
5. Placed lines (1) and (2): the export-flow link and the two pages.
6. Stub tests: one case per acceptance line below.

Acceptance (each line its own check; a stub test unless named):

1. R1 requests read: heads, lines, notices, paging.
2. R2 accept: the list quantities change as the app's accept; a `short`
   answer 409 `short` with what is available.
3. R3 accept with `clamp`: takes what is available.
4. R4 decline; a decided request answers its decided state.
5. R5 mark read.
6. R6 notices delete: the `confirm` rule; 101 ids 400.
7. R7 a request to another reader's list; a replay by `id` sends nothing
   twice; a request to the reader's own list is 409 `conflict` and sends
   nothing (audit N6).
8. P1 print set from `cards` (1 and 180 pass, 181 400, an unknown catalog
   id 400) and from `list_id`; 201 with `<site>p/<id>`; `limit_reached` 409.
9. `/mcp/me` lists the R and P tools and each calls its operation.
10. `openapi.json` 1.3.0 holds the B5d operations; the fixtures,
    `CONTRACTS.md` section 6 and `llms.txt` match.
11. R8 `GET /me/requests`: heads over two lists, paging, an expired request
    flagged, `unread_notices` per list (audit R1).
12. Placed line (1): the export flow («Скачать JSON», «Скачать мои
    данные») gets one link «Читать эти данные через ИИ-ассистента или API»
    / "Read this data through an AI assistant or the API" to the user page
    (owner note 7); a component test and the goldens.
13. Placed line (2): the user page and the developer page name the account
    operations and how to disconnect an app.
14. Placed line (3), decided at landing 3 (plan-B5b-4): the file-check and
    import cap stays 32768 B (p99 9.5-20.6 ms, past the 3 ms line); the
    closeout says so.
15. Placed line (4) (plan-B5b-N7): the A2 text in
    `C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md` names the
    shipped operations; posting it and closing issue 72 is a closeout
    step (section 6, "B5").
16. Placed line (5): the print-set tool (owner idea, 2026-11-12) is P1; no
    print endpoint and no PDF tool (X4).

Standing checks: 1. Scale: requests at the app's page size; R8 at 150
lists is one paged read, not 150; a print set 1-180 cards, 181 refused;
the export-flow link at 360 and 1180 px (goldens). 2. Errors: an accept
changes list quantities as the app's accept does; a retry of an accept or
a decline of a decided request answers the decided state; a notice delete
is permanent (`confirm`); a request send replays by id. A plan-review
trigger (a write protocol). 3. Consistency: the app's request semantics
and print-set rules; the link's wording matches the footer's
«ИИ-ассистенты». 4. RU/EN parity: the link text and the two pages' new
lines in both languages with the same facts.

Gate cost about 45 min (`check:fast`, CI with the goldens of placed line
1, the review). Review: required (a public contract; a write protocol).

## 7. Owner decisions

The owner left the architecture to the planner (option (c), sections 3.3
and 3.4) and may veto it. Settled on 2026-11-10 (owner; `context.md`
holds each answer and its home): Q1 (the neutral record only; no mapping,
no `format=`; D3); Q2 = A (every source, `rights`, the DPCGL notice in
`openapi.json`; D3); Q3 replaced (nothing posted on issue 72 before the
API is live; section 8); Q4 = B5 of this task (the Free-plan check done);
Q5 = yes (the shared 100,000 a day, no keys, no per-client limit); CORS
(`*` on public `/api/v1/`, none on `/mcp`, an allowlist on `/me`);
publication right after B1 (section 11, D6); Risk 6 (the privacy
sentence, section 3.6); two entry points (section 3.8, D2); Q6 = C (the
per-record audit, B0; rejected A and B); Q7 = A (the Russian text on the
site's reading, D5; rejected B and C).

Defaults taken (owner AFK), 2026-11-11, each the recommended option of a
B5 question; the owner may reverse any before B5a:

- Q8, the grant: one level, "read and change, and delete, your lists and
  homebrew items", bounded in the database (D7). Not chosen: a
  read-only level per client (a client table and a second consent text;
  Supabase has no custom scopes). Accepted: a reader cannot connect an
  app for reading only.
- Q9 (replaced by the owner, chat, 2026-11-12): a reader does through
  the API and MCP every action of the app's UI on their own data, except
  the exceptions of section 6, "UI action coverage" (sign-in, account
  deletion, display settings, the print page itself, local controls).
- Q10, the token: only a connected app's token (with `client_id`); the
  app's own session token is refused with 403. Not chosen: accepting
  both (a pasted session token carries sign-in and deletion past the
  guard). Accepted: a script needs the consent flow.
- Q11, browser clients on `/me`: the allowlist is empty at B5b. Not
  chosen: `*` (any page that holds a token reads the account, section 6,
  B5b, "CORS"). Accepted: the first browser client waits for a deploy.
- From `reviews/plan-B5a.md` (default taken (owner AFK), the report's
  recommended option): R1, the guard refuses a client token whose
  session ended (`api_client_session_live()`, B5a step 3); not chosen:
  stating an up-to-an-hour window after "Disconnect"; accepted: one more
  definer function. R7, an optional `If-Match` on `PATCH /me/lists/{id}`;
  not chosen: last writer wins only; accepted: one more guard row. N10,
  `?ids=` builds `records` from one index over the answer and names the
  `craft.from` difference; not chosen: one `get_homebrew_item` per id
  (up to 10 RPCs and their CPU); accepted: a mirror inverts `craft.into`.

Defaults taken (owner AFK), 2026-11-12, each the planner's recommended
option; the shipped ones are recorded in D8, D9 and D10:

- Landings (D8): B2a alone as landing 2, B3 and B2b together as landing 3
  (both done). The CPU fix (shipped in B2a): one record per line in the
  chunk files plus an isolate cache of the roll section's index. Search
  (D10): names and the facet columns only. Legacy MCP clients of
  `2025-03-26` get the `2025-06-18` shapes. The rejected options:
  `git show 51f830de:issues/ai-mcp/plan.md`, section 7.
- Owner (chat, 2026-11-12, repeated 2026-11-13): fallback 2 (per-total
  `apidata/roll/std/<total>.json`) is dropped as over-engineering; the
  `std` roll tail stays as measured at landing 2 (burst p99 17.1 ms, p50
  4.8 ms), with no batch; fallback 1 (an isolate cache of each chunk's
  split lines) stays the only optional step.
- The file-check cap: 32768 B at ship, raised only after a reading. Not
  chosen: 262144 B or 65536 B at ship (a cap may never fall). Landing 3
  decided it: the cap stays 32768 B (p99 9.5-20.6 ms against the 3 ms
  line; plan-B5b-4).
- The lists import panel takes the My items panel's file row with the two
  links (B2b, shipped). The export-flow link is B5d placed line (1).

Defaults taken (owner AFK), B3 pass, 2026-11-12 (shipped; D10 records
each with its rejected options): the search projection of build-time
folded names in text shards; 400 `too_broad` past 300 kept lines or 3000
anchor positions; the format id `api-search` and the row cut of record
v1; file-check lines that name a lists entry by item id only; one `lines`
array with a `list` index; `check_file` takes `file` as a string; `q` at
most 8 terms. The full text: `git show 51f830de:issues/ai-mcp/plan.md`,
section 7.

Owner requirements (chat, 2026-11-12, through the orchestrator) that the
B5 refresh applies: full UI parity (Q9 above); list share links through
the API (create, read, replace, revoke; lists only, no item share); every
list operation; homebrew items with full CRUD and every item action; the
items read paged with `id`, `key` and `link`; import and export of both
files; every bulk operation; a "UI action coverage" table built from
`app/src` for an independent audit; B5 split into B5a-B5d. Owner
instructions of 2026-11-13 (`context.md`): developer tokens are not built
(section 10); fallback 2 stays dropped; no print endpoint (X4).

Defaults taken (owner AFK), B5 refresh, 2026-11-12, each the planner's
recommended option; the owner may reverse any before its batch:

- The mock (`issues/ai-mcp/mocks/b5a-screens.html`): the consent card of
  the account page's panels, the primary action at its bottom; "Connected
  apps" after «Способы входа». Not chosen: a two-column consent page, or
  the section in the right column. Accepted: the consent card is long at
  360 px (about one and a half screens).
- No client logo on the consent page or in a row. Not chosen: drawing
  `logo_uri` (a third-party image on an account page, a CSP and privacy
  change). Accepted: the name and the host identify an app.
- The OAuth server off: the section is not drawn. Not chosen: the empty
  line (it says "no apps" when the reader may hold grants) or a failure
  line (production would show it until the owner's switch). Accepted:
  needs step 1's "off" answer; else production is switched on before the
  closeout deploy.
- Disconnect asks the browser's confirm (rule 10), then toasts. Not
  chosen: no confirm, as a provider's «Отключить» (a provider is connected
  again in the app; an app only from the app itself).
- `supabase/config.toml` owns `[auth.oauth_server]`, so the owner's
  production `config:push` is the switch (plan-B5a-R6). Not chosen: the
  dashboard switch only (a later push could switch it off). The test
  project's Site URL stays `http://localhost:3000`; step 1 reads the
  redirect in Node.
- The B5a probe reads `user_prefs` (refused for a client token, 200 for
  an app token). The earlier `print_sets` probe was defective.
- One migration (B5a) holds the guard list for all of B5. Not chosen: a
  migration per batch (three more `check:db` runs and plan reviews).
  Accepted: the database allows the B5b-B5d writes from B5a's ship on;
  the consent text names them from then on, and all four batches land
  together at the closeout squash.
- Picture upload is REST only (two WebP files, the header read, never
  decoded). Not chosen: base64 in a tool (past the 65536 B `/mcp` body
  cap); no upload (owner: every action). Accepted: an assistant can clear
  or reuse a picture but not upload one.
- Bulk caps 100 a call, 10 lists for a list delete; partial failure as the
  app's RPC (AL per op; the homebrew RPCs all or nothing). A `confirm`
  count on every multi-row delete; `expect_overwrites` on an import that
  rewrites. Not chosen: a cap by bytes only; a server-side "are you sure"
  token (a second request and state the worker cannot keep).
- Import and export caps (revised by plan-B5b-4, 2026-11-13): the import
  file at the file-check cap, 32768 B, with no condition; export pages of
  32768 B; the L2 read at 65536 B with a 422 past it. Each rises only
  after a production reading. Not chosen: export pages of 65536 B (no
  reading; a 64 KB page parses twice what landing 3 read at 10-14 ms
  cold). Accepted: a large account exports in more pages and a large file
  imports in parts or in the app; no ZIP through the API.
- The selection's price edits run the app's own functions
  (`lib/money.ts`) on the server. Not chosen: final values only (an
  assistant would round differently from the app).
- The batch cut B5a-B5d (section 6, "B5"). Not chosen: one B5b (one
  review for four contract areas); a separate batch per resource (more
  fixed gate cost with no new criterion).

Defaults taken (owner AFK), plan review and audit, 2026-11-13, each the
recommended option of its report; the owner may reverse any before its
batch:

- Placement of the audit findings: each goes to the batch of its own row
  (R2, R3, R7 to B5b; R4, R5, R6 to B5c; R1 as row R8 to B5d), the
  auditor's recommendation. Not chosen: every gap in B5d (the plan's
  earlier rule), because a B5d line would change an operation that B5b or
  B5c ships. Cost accepted: B5b gains 3 acceptance clauses and B5c 4, so
  their reviews read more; no batch, gate run or migration is added.
- `/mcp/me` lists the public tools after the account tools
  (plan-B5b-R2). Not chosen: account tools only (a one-connector client
  cannot add a record or read a shared list). Accepted: one tool list
  grows by about ten tools.
- A request to the reader's own list is 409 `conflict` (audit N6). Not
  chosen: sending it (the app hides the send there).
- Import ids are UUIDv5 names under `import_id` (audit B1). Not chosen: a
  server-side import log (state the worker cannot keep).
- The H11 body cap is 413696 B (two pictures plus 4096 B of multipart
  overhead), read before any parse.

Owner stop, not a question: B5a step 1 (a client token that changes the
email or the password, links or unlinks an identity, enrolls a factor, or
approves an OAuth authorization stops B5, plan-B5b-1; a global logout, a
`data` change and a list or revoke of grants are recorded, not a stop).
The owner's review of the audit table is an owner step (B0 step 11).

## 8. Announcement for issue 72 and the second consumer

The texts live in the owner note
`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`: A (the issue 72
comment after B1 is live; the issue stays open), A2 (the follow-up and the
close once the account-level read is live: a closeout step, plan-B5b-N7;
B5d acceptance 15 checks that its text names the shipped operations) and B (the
bacchus-atlas migration issue). The orchestrator posts them as that note
says; no batch and no gate waits on an answer. The text that this section
held until 2026-11-12 (the plan-B1 draft and the bacchus-atlas field
mapping) is in `git show 93eac0ae:issues/ai-mcp/plan.md`, section 8; the
bacchus-atlas facts are in `context.md`, "Second consumer". A mirror
stores the record's `link` and `image` URLs as given; since B2a a `link`
carries `?v` (D9).

## 9. Risks, assumptions, dependencies

- CPU on the deployed worker (Pages Metrics; the axis label says ms, the
  values read as microseconds, an assumption until a reading shows a value
  that only one unit explains). The cost model is a fixed floor (about 4.4
  ms cold, 3.2 ms warm) plus K times the local CPU (K 1.70-3.01; landing
  2). Landing 3's cold readings of search and the file checks are past 10
  ms (B3 outcome; the owner decides). B5's imports, exports and the L2
  read use the same parsers, so their caps start at 32768 B and 65536 B
  (plan-B5b-4); production readings of them exist only after the owner's
  production switch.
- The Workers free plan: 10 ms CPU, 50 subrequests a request (B5's rule
  is at most 20, "Common rules"), 100,000 Functions requests a day per
  account shared by the cards, the API and MCP; the worker bundle was
  80,280 B gzip after B3 against 3 MB compressed (documentation, not
  verified). `env.ASSETS` reads are assumed to cost no subrequest.
- MCP clients in the cloud may send an `Origin` header; `/mcp` answers
  403 to any `Origin`, so the owner's connector test is the proof, and
  the fallback is a client-origin allowlist (B2a outcome).
- The clients' connection steps change often; the user page links each
  client's official page (B2b).
- The `rights` values come from B0's per-record audit (Q6 = C); a later
  correction is a value change in `docs/rights/records.json`. Q7 = A
  accepts that DPCGL 1.9 names no website or API among the Permitted
  Formats; the takedown promise is the remedy. D5 names the DPCGL version
  and date it read.
- B5: the Supabase OAuth server is BETA; the guard's RPC half relies on
  PostgREST's pre-request setting, which a restore drops and the hosted
  project may refuse or ignore (the probe of B5a's acceptance, step 9's
  restore step, the named fallback of step 3); the guard list allows the
  whole parity scope from B5a's ship on, so a defect in one of B5b-B5d's
  rows is reachable at PostgREST before the worker serves it (each row
  has its own guard test); what a client token can do on Auth is
  unmeasured: change the email or the password, link or unlink an
  identity, enroll a factor, or approve an OAuth authorization (B5a step
  1 stop rule; an approve would let a connected app connect another app
  that survives its revoke, plan-B5b-1), and list or revoke grants
  (recorded); the token's personal claims and a `client_credentials`
  grant are unmeasured (step 1); Supabase does not bind `aud` to the
  resource (D7 accepts it); a quota burn also stops account sync until
  00:00 UTC.
- The earlier bullets (the B1 CPU reading, the MCP spec dates, CORS and
  the quota, Charkeeper's contracts, `get_shared_list` at the import
  limits): `git show 51f830de:issues/ai-mcp/plan.md`, section 9.

## 10. Deferred

- A lean share-list projection RPC if the 422 path is hit in practice (a
  migration and a definer: plan review).
- API keys, per-client quotas, cursors, sort and field parameters, batch
  reads, clipboard text, prices, `Access-Control-Expose-Headers` and more
  `Access-Control-Allow-Headers` (for example `If-None-Match`): until a
  consumer asks. Export formats and published mappings are not deferred;
  owner Q1 rules them out.
- Account tier, until a consumer asks (owner defaults Q8, Q10, Q11): a
  read-only grant per client, a browser client on the `/me` allowlist,
  webhooks or a push channel for sync, a picture upload through MCP (X9).
  The writes of sources, cards, pictures, share links and requests are no
  longer deferred (owner, 2026-11-12: B5b-B5d).
- Developer tokens (owner, chat, 2026-11-12): not built. Reason: needs a
  token table and migration, a screen, and a second guarded write path
  outside D7; OAuth clients and the public tier cover assistants and
  scripts. Revisit when two or more users ask for unattended access to
  their own account; then plan it as its own batch with a scope narrower
  than the OAuth client scope, an expiry and a revoke button. B5a step 1
  measures whether the Supabase OAuth server offers a machine-to-machine
  grant (`grant_type=client_credentials`) and records it; the guard
  refuses such a token while it has no live session (plan-B5b-R7).
- Usage numbers for the shared quota in the nightly usage report (Cloudflare
  analytics token): until the quota is near. Nothing shows today when it
  is near; the ceiling is about 500 users polling every 15 minutes
  (section 3.4), so B5b's first consumer with background sync reopens
  this item (plan-B5a-N12).
- `names.json` at three times the catalog: about 330 KB against the
  worker's `NAMES_MAX` of 196608 B, so every shared-list read would
  answer 503 at 3x (`reviews/B1.md` Risk 2; older than B1, the cards read
  the same file). Options for the batch that takes it: a lean name map
  for the API (catalog ids to the two names, only the ids a list holds
  cannot be known ahead) or a larger cap with a CPU reading. B3 does not
  read `names.json`.
- MCP `outputSchema`, resources and prompts, `subscriptions/listen`, SSE
  answers: until a client needs them.
- Search over descriptions and stat lines (D10): only with a paid CPU
  plan or a projection that fits 10 ms at 3x. Also deferred from B3: the
  reader's own items in search and an account context for file checks
  (B5b's surface), multi-valued facet parameters (a widened value list,
  allowed in place), names in a lists file check's lines (a lean name
  map, as for `names.json` above).
- Pages CORS on `/apidata/*`: accept whatever header Pages sends and add
  no `_headers` rule (`apidata/` is internal, `CONTRACTS.md` section 5).

## 11. Publication and the v1 freeze

v1 froze at B1's publication (D3); the frozen list is in `CONTRACTS.md`
section 6 (paths, parameters, formats, codes, caps, link forms, the MCP
tool names and arguments, the CORS rule, the host). Rules that B5 keeps:
a cap may rise later, never fall; a code keeps its status and meaning; a
client acts on the status of a code it does not know. Not frozen: the
`/api/v1/me/` answers, which carry `*` in v1 only because the prefix is
reserved; B5b replaces its 404 and its preflight with the allowlist. Safe
to add inside v1: a new resource (`/api/v1/me/`, `/mcp/me`, the
protected-resource metadata), a new `code` for a new case,
`securitySchemes` and `security` on the new operations only, a new
optional parameter or field, a widened value list, a higher cap. Anything
else is `/api/v2/` beside v1. The full list:
`git show 51f830de:issues/ai-mcp/plan.md`, section 11.
