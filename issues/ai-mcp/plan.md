# Plan - TASK ai-mcp

## Status

- Mode: B (planner pass of 2026-11-12 at `8019493d`, after landing 2: B3
  expanded to implement-ready with its search projection and file-check
  lines settled by this pass's own measurements; B2a collapsed to its
  outcome; the owner's print idea placed in B5b).
- Batches: B0 and B1 done (landing 1, `aeb68c0e`); B2a done (landing 2,
  `89a55f1b`, live on production; its readings are the orchestrator's,
  in progress, `handoff.md` "After B2a"); B3 implement-ready (next, after
  its plan review; its step 1 reads landing 2's readings); B2b
  implement-ready, after B3 (they land together at landing 3); B5a and B5b
  implement-ready outlines, blocked on owner steps (`handoff.md`,
  "Blockers"); B4 dropped. Order and landings: section 6, "Order of the
  remaining batches" (D8).
- NEEDS_HUMAN_CONFIRMATION: no. Q1-Q7 settled; Q8-Q11, the R1, R7 and N10
  options and the defaults of 2026-11-12 are "default taken (owner AFK)"
  (section 7); this pass adds the B3 defaults (section 7, "Defaults taken
  (owner AFK), B3 pass"). No product law changes.
- Plan review: required before B1 (trigger: a public contract change - the read API `/api/v1/`; a product-law change). The CORS rule of 2026-11-10 is part of the same contract change.
- Plan review: required before B5a (trigger: a migration that changes the PostgREST role config and adds restrictive table and storage policies and a SECURITY DEFINER helper; a new write and sync protocol; possible loss of stored data by a connected app's delete; a public contract change - `/api/v1/me/`, `/mcp/me`, a new app route).
- Plan review: required before B2a (trigger: a public contract change - the MCP endpoint `/mcp`, its tool names and shapes, the record `link` value, `docs/fixtures/mcp/`, `CONTRACTS.md` sections 5 and 6, `llms.txt`; B2b's `llms.txt` links). Done: `reviews/plan-B2a.md`, fix-then-continue, applied (below); it covers B2b too.
- Plan review: required before B3 (trigger: a public contract change - `GET /api/v1/records`, `POST /api/v1/file-checks`, the `filter` parameter of `GET /api/v1/tables/{table}`, the MCP tools `search_catalog` and `check_file`, the answer formats `api-search` and `api-file-check`, the error code `too_broad`, `openapi.json` 1.2.0, `CONTRACTS.md` section 6, `llms.txt`). No other trigger fires: no migration, no stored data, no write or sync protocol.
- Plan review findings applied: reviews/plan-B2a.md
  - plan-B2a-1 to plan-B2a-N13: applied 2026-11-12 and shipped in B2a (`89a55f1b`) or placed in B3 and B2b; the per-finding list is in `git show 8019493d:issues/ai-mcp/plan.md`, Status. The B3 inputs it raised (plan-B2a-4, -5, -6, -R1, -R4, -N10) are settled in B3 below.
- Plan review findings applied: reviews/plan-B1.md
  - plan-B1-1 to plan-B1-N9: applied 2026-11-10 and shipped in B1 (`aeb68c0e`); the per-finding list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B1-2.md
  - plan-B1-2-1 to plan-B1-2-N6: applied 2026-11-10 and shipped in B0 and B1; the list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B1-3.md
  - plan-B1-3-1 to plan-B1-3-N9: applied 2026-11-11 and shipped in B0 and B1; the list is in `git show 93eac0ae:issues/ai-mcp/plan.md`, Status.
- Plan review findings applied: reviews/plan-B5a.md
  - plan-B5a-1 to plan-B5a-N12: applied 2026-11-11 (B5a, B5b, D7 and the sections each names); the per-finding list is in `git show 8019493d:issues/ai-mcp/plan.md`, Status.
- This pass (2026-11-12, the orchestrator's dispatch; owner AFK):
  - B3: the search projection (build-time folded names in text shards with facet codes, an anchor scan, two caps and `too_broad`), the `f` field, the file-check context and answer shape, the report builders and `lineText`, the MCP argument rules; measured on this host (`context.md`, "B3 planner measurements (2026-11-12)").
  - Sections 3.3, 3.4, 3.5, 5.1, 9, 10 and 11, and D10: rewritten to that design; the search format is `daggerheart-loot/api-search` (`api-records` is already the internal `apidata/records/index.json` format).
  - B2a collapsed to its outcome (the last full text: `git show 8019493d:issues/ai-mcp/plan.md`).
  - B5b: placed line 5, the owner's print-via-AI idea (afk-decisions note, 2026-11-12).
- Total gate cost of the remaining work (`.claude/README.md`, "Batch size and the fixed cost of a run"; review runs are estimates of about 15 min): the plan review before B3 about 15 min; B3 about 45 min (`check:fast` 11-14 min, CI 15, its review 15); B2b about 105 min (with landing 3 and both batches' readings); B5a about 45 min and B5b about 25 min (as planned 2026-11-11, without their reviews), plus their reviews (about 30 min) and the closeout squash (about 23 min). Landing 2's readings (about 10 min) run now. Sum of what remains: about 4 h 50 min of gates, of which about 2 h 45 min before B5 starts.

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

Current state:

- The site's host is the Pages project `daggerheart-loot`. `cloudflare-pages`
  shipped as `d0fd98bc` (2026-10-28), not "no commits" as `context.md`
  first said; `/mcp` is reserved and answers 404 (`CONTRACTS.md` section 5).
- One stateless worker (`preview/worker.mjs`, Pages Functions advanced mode)
  answers the eight card families of `preview/public/_routes.json`. It reads
  `names.json` and `index.html` through `env.ASSETS` and two lean `anon`
  RPCs. CPU limit 10 ms a request; 100,000 Functions requests a day per
  account; static files are free.
- `data.js` (1.1 MB as JSON) is the only catalog authority
  (`docs/decisions/2026-09-24-data-js-in-git-is-the-only-catalog.md`). The
  build writes `data.json`, `catalog.csv`, `catalog-index.csv` and
  `names.json`. The app reads `data.js` as a classic script, with no async
  bootstrap and no loading state (`CONTRACTS.md` section 4).
- Every app function is a pure module in `app/src/lib/`, except the map of
  roll sections to tables, which is in `App.svelte`'s module script
  (`ROLL_TABLE`, `PICKER_ROLL`).
- `llms.txt` says "no public API" (the summary under the title and "What
  this site cannot do") or "there is no API" ("Lists as a file
  (import-v1)" and "Homebrew items as a file (homebrew-v2)").

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

Legend: needed = the API cannot do its job without it; desirable = a
client can do it from what the API already serves; no = not served.
"Shared" means one pure module run in two places.

| Area | Lives today | API | Implementation | Offline / URL state / contracts / RU-EN |
|---|---|---|---|---|
| Catalog records, refs, sets | `data.js`; `lib/data.ts` `buildIndex` | needed (records) | shared: `tools/api-data.mjs` renders projections with `buildIndex` and `apiRecord.ts`; one implementation | app unchanged; new frozen API paths; both languages in every record |
| Record text and stat line (plain text, path, stat words) | `lib/i18n.ts`, `lib/label.ts`, `lib/markup.ts` | needed (payload) | shared, run at build time for catalog records and at request time for homebrew items (`apiRecord.ts`) | both languages from the same functions the app draws with |
| Relations: craft, set, upgrade line | `lib/data.ts` `relate`, `upgradeLine` | needed (payload) | shared, build time; at request time for homebrew through `withRecords` | ids are frozen record ids |
| Tables and their parts (VoA sections, communities, realms, volumes) | `lib/tables.ts`, `lib/sections.ts`, `lib/sectionProps.ts`, `App.svelte` module script | needed (tables, rolls) | shared; B1 moves `ROLL_TABLE` and `PICKER_ROLL` to `lib/rollTables.ts` and adds `rowsOf(section, index, part)`, which `App.svelte` and the service both call (extraction on its second use) | URL ids from `ROUTES.md`; part names from `dict.ts` in both languages |
| Rolls (Nd12, duality and crit bump, pick 1-N, upgrade-line rungs left out) | `lib/roll.ts`, `lib/std.ts`, `lib/alt.ts` | needed (the roll operation) | shared: the worker bundles the same modules and calls `buildIndex` on a lean per-section projection, then `rowsOf`, `poolFor`, `altPicks`, `bumpUp`, `rollPool`, `pick` exactly as the panels do | the app keeps rolling locally; the API answers the dice, so a GM can type the same number in the app |
| Filters (`f_` grammar, predicate) | `lib/filters.ts` (frozen grammar), `lib/facets.ts` (values, labels) | desirable (a client can filter a whole table it fetched); needed for "a table with options" in one call | shared: the API takes the frozen `f_` segment as its `filter` parameter, so one grammar serves addresses and API calls (B3) | no new grammar; facet labels from `dict.ts` in both languages |
| Search (words in any order, Snowball forms, quotes) | `lib/search.ts` with `@orama/stemmers` | desirable for REST (`catalog-index.csv` and the table reads serve a client); needed for the settled MCP catalog tool | shared: B3 scans build-time folded names in text shards and ranks with `search.ts` (`parseQuery`, `rankHits`) on names, never descriptions (D10) | both languages at once, as the app's search |
| Sorting | tables keep book order; `rankHits` ranks search | desirable | no sort parameter: a table answers in book and roll order, a search in `rankHits` order | the order the app draws |
| File checks (`import-v1/2/3`, `homebrew-v1/2`) | `lib/bundle.ts` `parseBundle`, `lib/homebrewFile.ts` `parseHomebrew` | needed for the settled MCP file tool; desirable for REST (a script checks a file before import) | shared (B3); input cap 32768 B at ship (D10), JSON only, no zip; the report builders move from the two import components to `lib/importReport.ts` and `lib/homebrewReport.ts` | the same errors the import shows, in both languages |
| Share-link resolution | `get_shared_list` (definer, Supabase); the app resolves catalog ids with its index | needed (shared lists) | the service reads `get_shared_list(text)` as `anon` with a 65536 B cap, shapes it with `sharedListOf` of `lib/cloudLists.ts`, names catalog entries from `names.json` and builds each homebrew entry's record from its snapshot with `apiRecord.ts` | the link's audience decides, as in the app |
| Homebrew item by id | `get_homebrew_item(uuid)` | needed | the service reads it as `anon` with a 65536 B cap, reads it with `itemOf` of `lib/cloudLists.ts`, shapes it with `apiRecord.ts` | the `#/h/` audience |
| Clipboard text (`share.ts`) | `lib/share.ts` | desirable | not served: no `format=` parameter exists (owner Q1); a later resource would need the full index and `dict.ts` at request time | - |
| Prices (`money.ts`) | `lib/money.ts` | desirable | not served until a consumer asks | - |
| Print, card layout, fitting | `lib/print.ts`, `printSet.ts`, components | no: a browser measures the fit; a print set is signed-in only | - | - |
| Account lists, requests, live updates, homebrew editing | `lib/cloudLists.ts`, `requests.ts`, `live.ts`, `homebrew.ts`; Supabase RPCs | B5 (OAuth); the RPCs and RLS stay the authority | relayed with the reader's token; no second write path | privacy pages change again in B5 |
| Routes and links | `lib/hash.ts` | needed (every answer carries site links) | shared: `recordUrl`, `appUrl` at build time | frozen path form |
| UI-only state (prefs, pending, header scroll, editor, number field, plural words) | `lib/*` | no | - | - |

Rejected moves, with the reason:

- The app as a client of the API (rolls, search or tables over HTTP): every
  page gains a loading and an error state, a quota burn of the shared
  100,000 then breaks the app itself, and `CLAUDE.md` forbids runtime
  `fetch()` for local data. The app keeps every function local.
- The catalog in Postgres: a second authority for 1593 records, a sync step
  per data change, egress against 5 GB and the 3 s statement timeout, for
  no gain over static projections; the rejection of 2026-09-24 still holds.
- Two implementations of any rule: every rule the API applies is the app's
  own module, run at build time or bundled into the worker.

The target split: the frontend keeps everything it does today. The backend
serves (1) build-time projections that the app's own modules render and
(2) request-time operations whose answer depends on input or randomness:
roll, filter, search, file check, and the two Supabase reads. Supabase
stays the only store and the authority for account data.

### 3.4 The contract (owner clarification 2)

Resource-oriented REST, version in the path, both languages in every text
field, JSON only. B1 ships the first column; later batches add rows
additively.

| Resource | Operation | Batch | Answer |
|---|---|---|---|
| `GET /api/v1/openapi.json` | the description | B1 | OpenAPI 3.1 |
| `GET /api/v1/rolls` | list the roll sections, their modes, parts and options | B1 | `daggerheart-loot/api-rolls` v1 |
| `POST /api/v1/rolls/{section}` | roll a section, or resolve a typed number | B1 | `daggerheart-loot/api-roll` v1 |
| `GET /api/v1/tables` | list the catalog tables | B1 | `daggerheart-loot/api-tables` v1 |
| `GET /api/v1/tables/{table}` | one table's rows; `part` (required on `eq_weapon`, `eq_secondary`, `eq_armor`) | B1; `filter` B3 | `daggerheart-loot/api-table` v1 |
| `GET /api/v1/records/{id}` | one catalog record | B1 | `daggerheart-loot/record` v1 |
| `GET /api/v1/catalog/index.json`, then the chunk URLs it names | every catalog record, in few reads; static files, no Functions request | B1 | `daggerheart-loot/api-catalog` v1; chunks `daggerheart-loot/api-catalog-chunk` v1 |
| `GET /api/v1/homebrew-items/{uuid}` | one homebrew item | B1 | `daggerheart-loot/record` v1 |
| `GET /api/v1/shared-lists/{token}` | one share link's list | B1 | `daggerheart-loot/api-shared-list` v1 |
| `GET /api/v1/records?q=&kind=&source=&table=&tier=&rarity=&limit=` | search and filter the catalog | B3 | `daggerheart-loot/api-search` v1 |
| `GET /api/v1/tables/{table}?filter=f_...` | narrow a table by the `f_` grammar | B3 | `daggerheart-loot/api-table` v1 |
| `POST /api/v1/file-checks` | check a lists or homebrew file | B3 | `daggerheart-loot/api-file-check` v1 |
| `/api/v1/me/...` | the reader's lists and homebrew items, read and write (section 6, B5b) | B5b | `api-my-lists`, `api-my-list`, `api-my-items`, `api-my-item` v1 |

Versioning and the frozen-contract policy (decision D3, below): the paths,
parameter names, field names, the values of each answer's `format` field
and the CORS rule of v1 are frozen once published (section 11 lists
them). In place: a new optional parameter, a new field, a new resource,
a widened value list (the rule of 2026-10-21, "A value list of a frozen file
schema widens in place"). Anything else is `/api/v2/` beside v1, and v1
keeps answering. Clients must ignore unknown fields; `openapi.json` says so.
Each answer names its `format` and `version`. Owner rule (2026-11-10, D3):
`openapi.json` is the one source for the MCP tools, and no extension point
is added before a second consumer needs it.

Sources and license (owner Q2 = A, 2026-11-10, D3): the API serves every
source `data.json` publishes. Each record carries `source`, `link` and
`rights` (section 5.3); `openapi.json` `info.description` carries the DPCGL
notice of `README.md`, "Rights". The `rights` value of each record comes
from B0's per-record audit table `docs/rights/records.json` (owner Q6 =
C), read at build time; B1's squash waits on the owner's review of it,
and until that review `licenseOf` answers `owner` for every record.
The API serves the Russian text on the same reading as the site and
`data.json` (owner Q7 = A).

CORS (owner, 2026-11-10, D3): every public (T0) answer under `/api/v1/`
carries `Access-Control-Allow-Origin: *` and no
`Access-Control-Allow-Credentials`; an `OPTIONS` request answers 204 with
`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET,
POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type` and
`Access-Control-Max-Age: 86400`. A browser client calls the API directly,
with no proxy. The account paths `/api/v1/me/` (B5) are outside the
promise of this rule: in v1 the prefix is reserved and holds no data, so
its JSON 404 and its preflight carry `*` only as the one responder's
default (section 5.1); B5b replaces both answers with an explicit
`Origin` allowlist, never `*` (empty at B5b; the reason is in B5b). The
static catalog files under `/api/v1/catalog/` and the catalog image URLs
under `<site>img/` and `<site>og/` answer `Access-Control-Allow-Origin: *` from Pages, which
the `check-site` probe holds (B1 step 9). `/mcp` (B2) sends no
CORS headers and answers 403 to a browser `Origin` (MCP spec, DNS
rebinding). `apidata/` stays internal (`CONTRACTS.md` section 5): a
browser client has the frozen `/api/v1/` and no reason to bind to it.

Auth tiers:

| Tier | Serves | Status |
|---|---|---|
| T0 public read, no key | rolls, tables, records, the bulk catalog, homebrew items by id, shared lists by token, file checks; an `Authorization` header is ignored and never forwarded, so a T0 answer never depends on the caller | B1-B3 |
| T1 API key | higher limits or revocation for one client | left out: a key needs a store (a table and an issue screen) or a Pages secret per client (a deploy per key), and the worker cannot count a quota per key without a store |
| T2 OAuth 2.1 (Supabase Auth server) | the reader's own lists and homebrew items, read and write, under `/api/v1/me/` and `/mcp/me`; an OAuth client token only (a token with `client_id`) | B5a (the guard and consent), B5b (the API) |

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

Rate limits: none per client, because counting needs state the worker may
not keep, and the free `pages.dev` host has no Cloudflare rate-limit rule
(it is not a zone the owner holds). The guard is the design: discovery
answers carry `ETag` and `Cache-Control: public, max-age=300`, a roll is
one request, and `openapi.json` and `llms.txt` state fair use ("cache the
lists; at most one request per user action"). A quota burn stops the cards,
the API and MCP until 00:00 UTC; the app itself, the record pages and every
`#/` address keep working, because static files cost no Functions request
(unverified, as for the cards). Accepted for the cards on 2026-10-14; this
plan extends the same acceptance (owner Q5 = yes, 2026-11-10).

CORS and the quota: a browser `POST` roll with `Content-Type:
application/json` sends a preflight, and each preflight is one more
Functions request on the shared 100,000. A `GET` with no custom header is
a simple request and sends none. `Access-Control-Max-Age: 86400` lets a
browser reuse the preflight per origin and URL; Chromium caps the reuse at
7200 s and Firefox at 86400 s (vendor documentation, not verified in this
session), so a browser tool that rolls one section pays at most one
preflight per 2 hours on Chromium. Browser traffic now reaches the quota
directly; the guard is the same fair-use text, and a quota burn has the
same effect as from a server.

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

Payload formats: one neutral record, `daggerheart-loot/record` v1
(section 5.3), with normalized stats (damage dice and bonus apart, named
thresholds, numeric burden, enum traits and ranges), so a target mapping is
mechanical. There is no `format=` parameter and no published mapping:
every consumer maps the neutral record as it wants (owner Q1,
2026-11-10, D3).

Caching: every `apidata/` file carries `data_version` (the hash the build
writes into `apidata/version.json`). A projection answer carries `ETag:
"<data_version>"` of the files this answer read, and answers 304 to a
matching `If-None-Match`; a 304 still costs one Functions request, so the
saving is bytes and CPU, not quota. Homebrew, shared lists and rolls
answer `Cache-Control: no-store`; every `/api/v1/me/` answer (B5b)
answers `Cache-Control: private, no-store`. The static catalog files
carry the `ETag` and `Cache-Control` that Pages sends (free).

OpenAPI as the one source: `preview/api/openapi.json` (hand-written,
committed) names every operation, parameter and schema. The REST adapter
routes by it; the MCP adapter (B2) builds `tools/list` from each operation's
`x-mcp-tool` name, `summary`, `description` and parameter schemas at isolate
start. A test holds the parameter parsers to the document.

Left out until a second real consumer asks (`CLAUDE.md`: no abstraction
ahead of need): API keys and quotas per key;
`Access-Control-Expose-Headers` (a browser's HTTP cache revalidates with
`ETag` without it); webhooks and MCP `subscriptions/listen`; cursors (a table answers whole, or
one tier part for an `eq_*` table: the largest answer is 145 rows today,
`dv` and the tier 3 part of `eq_weapon`, and 435 at 3x; `eq_weapon` whole
is 512 rows today and 1536 at 3x, which is why its `part` is required);
`sort` and `fields` parameters; batch reads of catalog records by many
ids (the bulk catalog serves the whole catalog in few static reads; B5b's
`?ids=` serves the reader's own items); clipboard text;
prices; GraphQL; client
SDKs; a Discord interactions endpoint (a bot is a REST client); localized
error messages (English text and a stable `code`).

Where flexibility costs more than it earns:

- Full-text search composed with arbitrary filters at request time: 10 ms
  CPU. B3 measures before any promise past names and facets.
- Per-target mappers for schemas that change fast (Charkeeper's item
  modules moved and `bonuses` became `modifiers` between two sessions): a
  frozen mapper on a moving target breaks either the freeze or the target.
- API keys without a store: they cannot meter, only revoke, and each key is
  a deploy.
- Moving app functions behind HTTP: loses the static-host behavior and
  gains nothing a projection does not give.

### 3.5 CPU and size budgets

Measured 2026-11-10 in Node on this host (`context.md`): the largest table
in full, `voa`, 167,888 B, parses in 1.2 ms; its lean rows are 15,315 B.
The equipment tables are larger: `eq_weapon` 512 rows, `eq_secondary` 148,
`eq_armor` 118. The lean rows of `eq_weapon` (id, n, name, kind, tier,
rarity, part, rung) are 74,986 B without `eq` and 144,444 B with it, so the
whole table passes the 131072 B budget at 3x without `eq` and today with
it. The table rows therefore carry no `eq` (a client reads stats from
`records/{id}`), and each `eq_*` table is cut by tier. The worker runtime
is slower than this host by an unknown factor, so the projections hold
every record and index file at most 65536 B, every roll, table and cards
file at most 131072 B, and a request reads at most five files:

| File | Holds | Budget (`tests/derived.js`) | Today | At 3x, est. |
|---|---|---|---|---|
| `apidata/rolls.json` | roll sections, modes, parts, options, links | 65536 B | about 10 KB, est. | about 30 KB |
| `apidata/tables.json` | catalog tables, parts, row counts, links | 65536 B | about 8 KB, est. | about 24 KB |
| `apidata/cards.json` | the catalog `refs` and `sets`, and `members`: for each catalog set key, its member records cut to `id`, `src`, `kind`, `set`, `en`, `ru`, `ende` and `rud` (5 records today); for a homebrew record and a shared list | 131072 B | about 33 KB (29,854 B measured, plus 2,993 B of members, measured) | about 100 KB |
| `apidata/roll/<section>.json` | a lean loot of the tables one roll section reads; each record carries its chunk number `c` | 131072 B | at most about 30 KB (`std`: four tables), est. | about 90 KB |
| `apidata/table/<table>.json` | a table's rows: id, n, name, kind, part, tier, rarity, rung; no `eq` | 131072 B | at most 20,816 B (`dv`, 145 rows), measured | about 63 KB |
| `apidata/table/<eq table>/<tier>.json` | one tier part (`1`-`4`, `A`) of `eq_weapon`, `eq_secondary` or `eq_armor`, the same row fields | 131072 B | at most 21,511 B (`eq_weapon` tier 3, 145 rows), measured | about 65 KB (435 rows) |
| `api/v1/catalog/<n>.json` (public, static; the worker reads the same files) | `{ format: "daggerheart-loot/api-catalog-chunk", version, data_version, records: [<record v1>] }`, packed in id order to at most 65536 B a file | 65536 B each | about 36-46 files (2.3-3.0 MB), est. | about 110-140 files |
| `api/v1/catalog/index.json` (public, static, not read by the worker) | `{ format: "daggerheart-loot/api-catalog", version, data_version, chunks: ["<site>api/v1/catalog/<n>.json", ...], records: [{ "id", "rev", "chunk" }] }`; `rev` is an opaque string, today the first 8 hex of SHA-256 over the record's JSON; `chunk` indexes `chunks` | 262144 B | about 69 KB (1593 rows such as `{"id":"ci12","rev":"0123abcd","chunk":12},`, about 43 B), est. | about 210 KB (longer synthetic ids) |
| `apidata/records/index.json` (internal) | `chunks`: the ids of each record file, one list per file | 65536 B | about 16 KB, est. | about 57 KB, near the budget |
| `apidata/version.json` | the data version: a hash over every other output rendered with `data_version` empty, then stamped into each file | - | 40 B | 40 B |
| `apidata/search/index.json` (B3) | the shard count and the facet code lists | 65536 B | about 3 KB, est. | about 3 KB |
| `apidata/search/<n>.txt` (B3) | a head line, then one record per line: 5 facet codes, folded names, id, card version, display names | 262144 B | 1 file, 204,426 B, measured | 3 files, at most 262,108 B, measured |
| `apidata/file-check.json` (B3) | catalog set keys, rule-card keys, upgrade lines with their types | 65536 B | a few KB, est. | about 3x |
| `apidata/table/...` with `f` (B3) | the rows plus their facet values | 131072 B | at most 39,493 B (`eq_weapon` tier 3), measured | about 118,479 B |

Every file is `{ format, version, data_version, ... }`. The build reports
the real chunk count and the size of `records/index.json`; B1 writes both
into `.claude/README.md`, "The CI deploy".

Reads per operation (heaviest case at today's size):

| Operation | Reads | Parsed at most |
|---|---|---|
| `GET /rolls` | `rolls.json` (cached) | about 10 KB |
| `POST /rolls/{section}` | `roll/<section>.json`, then each distinct record file of the results (at most four), by the rows' `c`; no `records/index.json` | about 30 KB + 4 x 64 KB = about 290 KB (`std`, the heaviest) |
| `GET /tables` | `tables.json` (cached) | about 8 KB |
| `GET /tables/{table}` | `tables.json` (cached), one table or tier file | about 30 KB |
| `GET /records/{id}` | `records/index.json` (cached), one record file | about 80 KB |
| `GET /homebrew-items/{uuid}` | `get_homebrew_item` (cap 65536 B), `cards.json` (cached) | about 100 KB |
| `GET /shared-lists/{token}` | `get_shared_list` (cap 65536 B), `names.json` (cached, 93 KB), `cards.json` (cached) | about 190 KB cold |
| `GET /records` (B3) | `search/index.json` (cached), every shard (cached as prepared text); nothing parsed as JSON but the index | 204 KB of text decoded cold today, 620 KB at 3x; a warm request decodes nothing |
| `GET /tables/{table}?filter=` (B3) | as `GET /tables/{table}` | about 40 KB |
| `POST /file-checks` (B3) | `records/index.json` (cached, its id `Set` kept beside it), `file-check.json` (cached); the file itself (at most 32768 B, parsed by the lists parser, then by the homebrew parser, and once more for an error's value) | about 110 KB |

Since B3 the rule reads: a request reads at most five files, cached ones
included (a search at 3x reads four), and parses no JSON file past its
budget; text shards are decoded, never parsed.

A `data_version` mismatch adds one read (Risk rule below). Measured on
production after the B1 deploy (2026-11-12): a `std` roll p50 about 7.5
ms and p99 about 17.5 ms of CPU, a record read 2-3 ms (context.md). So
B2a applies what was the fallback: the record files hold one record per
line, the roll rows carry `c` and `l` (the position), and the service
parses only the lines of its results; a warm isolate also keeps each roll
section's built index. The contract does not change. The next fallbacks,
if landing 2's `std` p99 stays above 5 ms, in order (B2a outcome):
an isolate cache of each chunk's split lines (no file, about 10 MB at
3x), then `apidata/roll/std/<total>.json` with the full records of each
total (60 files).

File count: about 90-100 files today against Cloudflare's 20,000 a
deployment (6573 today, about 19,700 at 3x before this task); at 3x the
projections add about 165-195. That stays under the limit, with about 105
files to spare, and `.claude/README.md`, "The CI deploy", records the new
margin. A projection per record was rejected for this reason (1593 more
files today, 4779 at 3x).

The worker keeps `rolls.json`, `tables.json`, `cards.json` and
`records/index.json` in isolate memory for 10 minutes, as it keeps
`names.json`. An isolate can outlive a deployment (`worker.mjs`), so a
cached file and a fresh file can come from two data versions. Rule: when a
fresh file's `data_version` differs from the cached file's, or a record
file lacks an id that the cached index places in it, the service reads the
cached file again once; a second mismatch answers 503 `unavailable`.

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
- B5a changes the privacy pages again: a reader's lists and homebrew
  items reach the app or AI vendor the reader connects, under that
  party's own policy, until the reader disconnects it on `#/account`;
  both pages state the consent page's scope sentence (B5a step 5), and
  the account's email and name when B5a step 1 finds them in the client
  token (plan-B5a-R5).
- B3 adds two operations to `CONTRACTS.md` section 6 and `llms.txt`, and
  one line to `ROUTES.md`, "Filter grammar" (the read API's `filter`
  takes the frozen `f_` segment).
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

The app and the API are two entry points to the same rules. The app does
not call the API. Checked against the repository at `342c91c4`:

1. One implementation of each rule. The rules are pure modules in
   `app/src/lib/` (`roll.ts`, `std.ts`, `alt.ts`, `sections.ts`,
   `tables.ts`, `data.ts`, `filters.ts`, `facets.ts`, `search.ts`,
   `bundle.ts`, `homebrewFile.ts`, `cloudLists.ts`, `hash.ts`, `art.ts`;
   all exist). The app imports them; the worker bundles the same files
   (B1 step 6). B1 adds two: `rollTables.ts` (moved out of `App.svelte`,
   which both call) and `apiRecord.ts` (built only from existing
   functions).
2. One data source. `data.js` is the only catalog authority; B1's
   `tools/api-data.mjs` renders `apidata/` from it at build time with
   those modules, in the same deploy as the app.
3. Enforcement by tests. Pinned fixtures (`docs/fixtures/api/v1/`,
   compared byte for byte), `tests/contracts.js` (fixtures, routes,
   `openapi.json` paths against `CONTRACTS.md` section 6), and the parity
   tests: the worker's roll pool equals the app's pool for every section
   and part (B1 step 5), and a fixed `random` gives the record the app's
   panel gives (B1 step 10).
4. The residual cost. Each new operation needs a service function, an
   `openapi.json` entry and a fixture. Anything the app computes in a
   component and the API needs must first move into a pure module: the
   tables page composes `passes` and `matches` of `lib/` inside
   `TablesPage.svelte` (the facet and search composition), so B3 extracts
   it before `filter` and `q` can be served. A change of a shared module
   can change an API answer; the pinned fixtures are the second gate that
   catches it, and an intended change re-pins a fixture inside the v1
   freeze rules (section 11).
5. Rejected: the app as a client of the API. Every page would gain a
   loading and a failure state, a quota burn would take the app down,
   `CLAUDE.md` forbids runtime `fetch()` for local data, the app would
   lose its offline use, and the app would become the API's largest
   client on the shared 100,000 requests.
6. Revisit rule. If drift shows in practice, move that one area behind
   the API in its own batch. The signal: a parity test of B1 steps 5 or
   10 fails twice on changes that touched one side only, or a review
   finds one rule implemented twice (in `preview/api/` and in
   `app/src/`). D2 records the rule.

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

To write:

- D10 (B3) "API search scans build-time folded names, and file checks
  start at 32 KB". The build writes each record's folded names, facet
  codes, id, card version and display names as one line of text shards
  (`apidata/search/`); a request scans the shards with `indexOf` for the
  query's most selective term, tests the other terms on the found lines,
  refuses a query past 300 kept lines or 3000 positions (`too_broad`),
  and ranks with `rankHits` of `search.ts` on names only. `filter`
  applies the app's `passes` to a build-time `f` field. The file check
  runs the app's parsers and report builders over a lean context
  (catalog ids, sets, rule cards, lines) at a 32768 B cap, raised only
  after a production reading. Measured 2026-11-12 (`context.md`).
  Rejected: names and stat lines as JSON (past 10 ms at 3x); a Hay with
  descriptions (past every budget); `names.json` (a 107-330 KB parse
  per request); folding or splitting every line per request (36-79 ms
  and 1.9-5.3 ms here, plan-B2a-4); a minimum word length (refuses
  `яд`); answering a broad query unranked (an order that is not
  `#/search`'s); a 262144 B file-check cap; a Supabase Edge Function now
  (a deploy channel and a token; kept as the owner's option).
- D7 (B5a) "A connected app reaches only the API's account scope, and the
  database enforces it". A Supabase OAuth access token is a normal
  `authenticated` JWT plus `client_id` (no custom scopes; verified
  2026-11-11, `context.md`), so its holder can call PostgREST at
  `<ref>.supabase.co` directly, past the worker. The guard therefore
  lives in Postgres: a PostgREST pre-request function refuses a token
  with `client_id` on every table and RPC outside the API's list,
  restrictive policies on the other tables refuse it too (they bound
  resource embedding, which the pre-request function cannot see), and
  restrictive storage policies refuse its writes; the pre-request
  function also refuses a client token whose session a revoke ended,
  so "Disconnect" stops an unexpired token at once. One grant level ("read
  and change your lists and homebrew items"); sync by heads, commands
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

- Host: `https://daggerheart-loot.pages.dev`; the API answers only on the
  production host, as the cards (the host guard answers 301).
- Methods: `GET` and `HEAD` on reads, `POST` on `/api/v1/rolls/{section}`,
  `OPTIONS` on every path under `/api/`; any other method answers 405 with
  `Allow` (`GET, HEAD, OPTIONS` on a read path, `POST, OPTIONS` on a roll
  path). A `POST` whose `Content-Type` is not `application/json`
  (parameters such as `charset` allowed) answers 415: the body is JSON
  only, and a form or text body is not a supported shape. The media type
  is compared without regard to case. An empty body with
  `application/json` reads as `{}`, because the `table` and `part` modes
  have only optional fields; the schema check then decides.
- Check order (plan-B1-3-N5; section 11 freezes the status of each case,
  and the fixtures pin this order): the host guard 301, `OPTIONS` 204,
  the path template 404, the method 405, the section or table id 404,
  415, 413, then the body parse and the schema 400.
- `OPTIONS` (the CORS preflight) on bare `/api` and on any path under
  `/api/`, a known path or not: 204, no body, `Access-Control-Allow-Origin: *`,
  `Access-Control-Allow-Methods: GET, POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type`, `Access-Control-Max-Age:
  86400`, and the security headers below except `Content-Type` (no
  body). The router answers it before
  the path lookup, so a preflight never reads a file; the request that
  follows gets its own 404 or 405. It sends no
  `Access-Control-Allow-Credentials` and no `Vary: Origin` (the value is
  `*` for every origin).
- Answer headers on every answer under `/api/` (the static catalog
  apart, below), an error, a 304 and a
  thrown error included: `Access-Control-Allow-Origin: *` (bare `/api` and
  an unknown path too: one rule in one responder, so a browser client can
  read every error), `Content-Type: application/json; charset=utf-8`,
  `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src
  'none'; frame-ancestors 'none'; sandbox` (an API answer is not an app
  document, so the cross-host objection to a CSP on the app does not
  apply), `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`;
  `Cache-Control` and `ETag` by section 3.4. `rest.mjs` has its own JSON
  responder; it never calls `answer()` or `failed()` of `worker.mjs`,
  which send `text/html`. The CSP `sandbox` and `nosniff` stay with CORS:
  CORS lets another origin's script read the JSON, and the two headers
  keep a browser from running or sniffing it as a document.
- The one exception (plan-B1-3-N6): the host guard's 301 on a deployment
  host or a branch alias still comes from `answer()` in `worker.mjs`,
  before `rest.mjs` runs. It has no CORS header, no `nosniff` and no JSON
  body, because the API answers on the production host only.
- The path prefix `/api/v1/me/` is reserved for B5 and answers the JSON
  404 in v1, and its preflight the 204 above, both with
  `Access-Control-Allow-Origin: *`. They carry `*` only because the path
  is reserved and holds no data in v1; v1 promises no CORS rule for it.
  `CONTRACTS.md` section 6 states this, and that B5 replaces both answers
  with an explicit `Origin` allowlist instead of `*`.
- Bare `/api` and any unknown path under `/api/` answer the JSON 404,
  except under `/api/v1/catalog/`: there a miss is Pages' `404.html` with
  status 404.
- The static catalog files (`/api/v1/catalog/*`, section 3.5) are the
  one part of `/api/v1/` that Pages serves: `_routes.json` excludes the
  prefix, so they cost no Functions request and carry the Pages headers
  (`Access-Control-Allow-Origin: *`, held by the `check-site` probe),
  plus a `_headers` rule with `X-Robots-Tag: noindex` and
  `X-Content-Type-Options: nosniff`. They take no `OPTIONS` answer of
  this section and no CSP `sandbox` (a static JSON file is not run).
- T0 paths ignore an `Authorization` header and never forward it: every
  Supabase read of B1-B3 runs as `anon`, so a T0 answer never depends on
  the caller, and `*` stays safe. Only `/api/v1/me/` (B5b) reads it.
- A path run past 2048 characters reads as empty (the cards' rule). A
  request body past 4096 bytes (rolls) answers 413 before parsing.
- Errors: `{ "format": "daggerheart-loot/api-error", "version": 1, "error":
  { "code": "<code>", "message": "<English sentence: the cause and the
  expected state>" } }`. A message names a field by its schema name and
  never echoes the raw path, a parameter value or the body.

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | a parameter or body field fails its schema; the message names the field (for a missing `part` on an `eq_*` table, the part list too) |
| 404 | `not_found` | an unknown path, section, table, part, record id, homebrew id or share token |
| 405 | `method_not_allowed` | another method; `Allow` names the allowed ones |
| 413 | `too_large` | a request body past its cap |
| 415 | `unsupported_media_type` | a `POST` body that is not `application/json` |
| 422 | `answer_too_large` | a Supabase answer past the service's 65536 B cap (a shared list or a homebrew item with very many entries or related rows); the message gives the app link |
| 503 | `unavailable` | an `env.ASSETS` read or a Supabase read failed, timed out or was not valid JSON; a second `data_version` mismatch |
| 400 | `too_broad` (B3) | a search query `q` past 300 kept lines or 3000 anchor positions; the message asks for a longer word or a filter |

The `code` list widens in place with new resources and cases (B3 adds
`too_broad`; B5b adds
401 `unauthorized`, 403 `forbidden`, 409 `conflict` and `limit_reached`,
412 `precondition_failed`, 428 `precondition_required`); a code keeps its
status and meaning for good. `openapi.json` and `CONTRACTS.md` section 6
say from B1: a client that meets a `code` it does not know acts on the
HTTP status.

- Every text a person reads is a pair `{ "ru": "...", "en": "..." }` built
  by the app's own functions, so it follows the app's rule: an empty
  Russian side takes the English text per field (`nameOf`, `descOf`), and
  an empty English side stays `""`. The `rights.notice` and the error
  messages are English only (section 5.3).
- Links are the site's path form, `{ "ru": "<site>i/<id>", "en":
  "<site>i/en/<id>" }`; since B2a with the opaque `?v` of the app's links
  when the record has a card version (D9; `catalog.csv`'s `url` stays
  without it).

### 5.2 Rolls

Shipped in B1; the contract is `docs/specs/CONTRACTS.md` section 6 and the `Rolls`,
`RollBody` and `RollAnswer` schemas of `preview/api/openapi.json` (modes `std`, `alt`,
`table`, `part`; dice kinds `nd12`, `typed`, `duality`, `pick`; `bump` at the top
of a crit answer). The design text: `git show 93eac0ae:issues/ai-mcp/plan.md`, section 5.2.

### 5.3 The neutral record `daggerheart-loot/record` v1

Built by `app/src/lib/apiRecord.ts`, for a catalog record at build time and
for a homebrew item at request time:

```json
{
  "format": "daggerheart-loot/record",
  "version": 1,
  "id": "ci12",
  "key": "ci12",
  "origin": "catalog",
  "kind": "item",
  "name": { "ru": "...", "en": "..." },
  "text": { "ru": "<Markdown subset>", "en": "<Markdown subset>" },
  "plain": { "ru": "<markupText>", "en": "<markupText>" },
  "source": { "id": "core", "name": { "ru": "...", "en": "..." } },
  "rights": { "license": "dpcgl", "notice": "This product includes materials from the Daggerheart System Reference Document 2.0, ..." },
  "path": { "ru": "<whereFrom>", "en": "<whereFrom>" },
  "table": "core_item",
  "roll": 12,
  "tier": null,
  "rarity": "common",
  "stats": null,
  "craft": { "into": [], "from": [] },
  "set": null,
  "refs": [],
  "image": { "full": "<site>img/x.webp", "thumb": "<site>img/thumb/x.webp", "card": "<site>og/x.jpg" },
  "link": { "ru": "<site>i/ci12", "en": "<site>i/en/ci12" }
}
```

| Field | Rule |
|---|---|
| `origin` | `catalog` or `homebrew`; a homebrew `id` is the item's row uuid, stable for the row's life and never reused, and `link` is `<site>h/<uuid>` and `<site>en/h/<uuid>` |
| `key` | the value that relation fields (`craft.into`, `craft.from`, `set.members`) and list entries hold: a catalog record's `key` equals its `id`; a homebrew record's is its `hb_` key, which never changes (`homebrew_items_before_update`). A homebrew key is unique within one account only (`CONTRACTS.md`, `hb_` row, "per account"); `id` is the key across accounts. A homebrew record carries no owner, no `mine` and no visibility field: an item is unlisted, readable by anyone who holds its id (`get_homebrew_item`), and `/api/v1/me/` answers hold only the reader's own rows |
| `kind` | `item`, `consumable`, `weapon`, `secondary` or `armor`: `eq.t` when the record has a stat block, else `kind` |
| `name`, `text` | `nameOf`, `descOf` per language: an empty Russian side takes the English text, English never takes Russian (section 5.1) |
| `rights` | `{ "license": "dpcgl" or "owner", "notice": "<English text>" }` (`license`, American spelling: `docs/decisions/`, 2026-10-29; the vocabulary is frozen with v1), per record from the build-time table `docs/rights/records.json` (B0's per-record SRD 2.0 audit, owner Q6 = C): `records[id]`, else the source row, which is always `owner`; while the table's `reviewed` is null, every record is `owner`. `dpcgl` means "the English text is SRD 2.0 Public Game Content" (the Russian text is a third-party translation, credited in `README.md`, "Sources", and not covered by the value; `openapi.json`'s `rights` schema description says so). `dpcgl` carries the DPCGL notice of `README.md`, "Rights" (SRD 2.0 text); a catalog `owner` carries "Text (c) its rights holders; not covered by the DPCGL; served as a play aid."; a homebrew item is `owner` with "Written by a daggerheart-loot user, who holds the rights." |
| `tier` | `eq.tier` for equipment (1-4 or `A`), else the record's `tier` for Vault of Ages (1-4, `A`, `C`), else `null`; `eq.tier` wins when both exist (45 Vault of Ages records carry both, equal today); never inferred (`CLAUDE.md`) |
| `rarity` | `index.rarityOf(id)`, else `null` |
| `stats` | `null`, or `{ "type", "tier", "class", "trait", "range", "damage": { "dice": "d8", "bonus": 2, "type": "phy" }, "burden": 1, "armor_score": 4, "thresholds": { "major": 5, "severe": 11 }, "line": "<head id>" or null, "alt": { "trait", "range", "damage" } or null, "statline": { "ru": "<eqLine>", "en": "<eqLine>" } }`; an absent value is `null`; `dmg` is always `dN` or `dN+K` (the catalog today; homebrew `/^d(4\|6\|8\|10\|12\|20)(\+[1-9][0-9]?)?$/`, `homebrew.ts`), so `damage.dice` is the `dN` part and `bonus` the integer 0-99 after `+` (0 when none, never negative); `burden` is `1`, `2` or `"any"` |
| `thresholds` | `eq.th[0]` is the Major threshold and `eq.th[1]` the Severe one (`dict.ts` `thMajor`, `thSevere`; `i18n.ts` draws `th[0]/th[1]`); B1 corrects the stale `types.ts` comment "Minor and major" |
| `craft` | `into`: `craft`; `from`: `index.craftedFrom` ids; homebrew keys stay keys |
| `set` | `null`, or `{ "key", "name": {...}, "bonus": {...} (Markdown subset), "members": [keys] }` (a catalog member's key is its id) |
| `refs` | the record's rule cards: `{ "key", "name": {...}, "subtitle": {...}, "text": {...}, "url": { "ru", "en" } }` |
| `image` | `null` when the record has no picture; a homebrew own picture is `site.art` (the Storage public base from `env.SUPABASE_URL`, `artBaseOf`) plus `p/` and `t/` names for `full` and `thumb`, `card` null |

The Charkeeper field check (an internal design check of record v1, not
published; nothing in the repository depends on it after B1) showed that
record v1 carries every field Charkeeper's import needs; the table is in
`git show 8019493d:issues/ai-mcp/plan.md`, section 5.3.

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

### Order of the remaining batches (planner, 2026-11-12)

B2a (done, landing 2), then B3's plan review, then B3, then B2b, then
B5a and B5b (B3's planner pass ran on 2026-11-12 after landing 2). B3
runs before B2b so that the
developer page is written once, over the final pre-account surface (every
operation of `openapi.json`, B3's included), and both land together
(landing 3, D8). Landings (D8, default taken (owner AFK)): landing 2 is
B2a alone (the `std` roll CPU fix reaches production, and MCP is measured
there); landing 3 is B3 and B2b; the closeout squash carries B5a and B5b.
B3's planner pass did not slip, so B2b waits for B3 (D8's rule). If B3's
plan review answers `replan`, or step 1 of B3 stops, B2b lands alone as
landing 3 and B3 lands with the closeout (the developer page then gains
B3's operations in B3's own commit).

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

Still open (the orchestrator's, `handoff.md` "After B2a"): the landing-2
readings with curl, one warm-up as the cold reading of each case (R1),
then a burst of 10; pass: `std` roll p99 at most 5 ms, record read p99 at
most 2 ms, MCP roll p99 at most 6 ms, every status as expected, no error
and no exceeded-CPU count; the readings go into `.claude/README.md`
("Quotas, recovery and failure") and `context.md`. Fallbacks, in order,
if the `std` p99 stays above 5 ms: (1) an isolate cache of each chunk's
split lines (warm cost only); (2) `apidata/roll/std/<total>.json`, 60
files of the full records of each total (removes the cold cost too; R1:
if only the cold reading fails, take (2) directly). Owner step: the
Claude connector with "No sign in"; a 403 means the client sends
`Origin`, and the fallback is an allowlist constant in `mcp.mjs` (find
the origin, add the constant, a fixture for an allowed and a refused
origin, record it in D4).

### B3 - Search, table filters and file checks (implement-ready after its plan review)

Status: implement-ready (planner pass of 2026-11-12, after landing 2). The
plan review before B3 is required (Status); `agent-guard.mjs` blocks the
implementer until it approves or its findings are applied. The inputs of
`reviews/plan-B2a.md` are settled here: plan-B2a-4 (the projection and
its access path, below), -5 (default (a): item ids, no names), -6 (one
32768 B cap in `runOperation`), -R1 and -R4 (steps 1 and 12), -N10
(`facetsOf`, step 4). Measurements: `context.md`, "B3 planner
measurements (2026-11-12)".

Objective: `GET /api/v1/records` (a search by names and facets), the
`filter` parameter of `GET /api/v1/tables/{table}`, `POST
/api/v1/file-checks`, and the MCP tools `search_catalog` and
`check_file`, each inside the 10 ms CPU limit at three times the catalog;
`openapi.json` 1.2.0.

Split criterion: a public-contract change of its own (two operations, a
parameter, two tools, two answer formats, an error code) on the worker
and the projections, with its own plan review, apart from B2b's route
and filter set (static pages, the footer, the goldens). Search, filter
and file checks stay one batch: they share the service, `openapi.json`,
the fixtures, the MCP adapter and one gate set (the component suites of
`TablesPage.svelte`, `ImportPanel.svelte` and `HomebrewImport.svelte`).

Writer: no open design question.

In scope: the operations, the tools, the projections, the extractions
(`facetsOf`, the two report builders, `lineText`), the specs, fixtures,
D10. Out of scope: descriptions and stat lines in search, sort
parameters, cursors, a zip file check, an account context for file
checks (B5b), own items in search, the pages (B2b), a raise of any cap.

Design (settled; do not reopen without a reading that fails):

- Search projection, internal (`CONTRACTS.md` section 5: `apidata/` is
  changed without notice):
  - `apidata/search/index.json`: `{ format:
    "daggerheart-loot/api-search-index", version: 1, data_version,
    shards: <count>, codes: { source, kind, table, tier, rarity } }`. Each
    code list holds the distinct values of that record v1 field in
    first-seen catalog order (`null` is a value; `source` holds whole
    `{ id, name }` objects, because a frame record's source name is its
    frame's). Code `i` is the character `String.fromCharCode(0x30 + i)`;
    a list of more than 64 values fails the build (today: 16, 5, 19, 7,
    6, the same at 3x).
  - `apidata/search/<n>.txt` from `0`: line 0 is the head
    `{"format":"daggerheart-loot/api-search-shard","version":1,"data_version":"<dv>"}`;
    then one record per line in the order of
    `api/v1/catalog/index.json`: five code characters (source, kind,
    table, tier, rarity), then `foldQuery(name.ru)`, TAB,
    `foldQuery(name.en)`, TAB, `id`, TAB, the card version or empty, TAB,
    `name.ru`, TAB, `name.en`; every line ends with `\n`. `name` is the
    record v1 pair (Russian falls back to English). Packed in order while
    a file stays within 262144 B: 1 file today (204,426 B), 3 at 3x
    (262,107, 262,108 and 95,435 B; measured).
  - The data version: the shard head is stamped as a chunk head is
    (`render()` treats `apidata/search/*.txt` as it treats the chunks).
- Search request (`service.searchRecords`), at most 4 files at 3x (the
  cached index and the shards; the "at most five files" rule holds):
  1. Read the cached index and every shard through a new `cachedText`
     (as `cached`, through `text`), each shard prepared once per cache
     period: its text, the start offset of each record line, and a lazily
     filled array of each line's folded-names part (`fru\tfen`). A shard
     head whose `data_version` differs from the index's: read again once
     (`consistent`), then 503.
  2. Facets: each given facet becomes the set of code characters whose
     value matches (`source` compares `id`; `table` compares the record's
     table with `tableOf(param)` of `service.mjs`; `tier` compares
     `String(value)`); a line passes when each of its five code characters
     is in its set.
  3. With `q`: `parseQuery(q)` of `search.ts`; more than 8 terms is 400
     naming `q`. A term's needles: `[stemPrefix]` when its `stemPrefix`
     is a substring of its `text`, `[text, stemPrefix]` when the
     `stemPrefix` is another string, else `[text]` (the necessary
     condition of `hitsAny`). The anchor is the term whose shortest needle
     is longest (the first such term on a tie). Scan each shard with
     `indexOf` for each anchor needle; past 3000 positions in all, answer
     400 `too_broad`. A position counts for its line only when it starts
     at or after the five codes and ends inside the folded-names part;
     the line must also pass the facets. Keep a found line, in line order,
     when every other term has a needle inside its folded-names part.
     Past 300 kept lines in all, answer 400 `too_broad`. Rank the kept
     lines with `rankHits(kept, terms, undefined, hay)`, where `hay`
     returns `{ names: [fru, fen], texts: [] }` from the line (the stored
     text is already folded, and `foldQuery` is idempotent).
  4. Without `q`: every line that passes the facets, in catalog order.
  5. `total` is the count of step 3 or 4; the first `limit` lines become
     rows.
- Search row: the record v1 fields of the same names, decoded from the
  line and the codes: `{ id, name, kind, source, table, tier, rarity,
  link }`; `link` is `recordUrl(site, id, lang, v || undefined)` per
  language, so it equals the record's `link` (D9).
- `filter`: every row of `apidata/table/*.json` whose table has facet
  groups gains `f`: `facetsOf(table)(it)` cut to `groupsFor(table)`, a
  missing value as `''` (eq_weapon tier 3: 24,305 B to 39,493 B today,
  about 118,479 B at 3x, inside 131072 B; measured). The service keeps a
  row when `passes(decodeFilter(filter, groups), groups, (g) => row.f?.[g]
  ?? '')`, and strips `f` from every answer row, with or without a
  filter. A group the table does not offer is ignored (the app's rule).
- File-check context, internal: the catalog ids are a `Set` built once
  per cached `apidata/records/index.json` (a `WeakMap`, as `ROLL_INDEX`);
  a new `apidata/file-check.json` (`{ format:
  "daggerheart-loot/api-file-check-data", version: 1, data_version,
  sets: [keys], refs: [keys], lines: { <line>: [{ key, t }] } }`) holds
  the catalog half of the homebrew `FileContext` (`HomebrewImport.svelte`
  `context()`): `key in sets`, `key in refs`, and for each distinct
  `eq.line` of the catalog `lineMembers(index, line)` as `{ key: id, t:
  eq.t }`. No account: `ownItem` false, `ownCard` null.
- File-check answer `daggerheart-loot/api-file-check` v1, always 200 for
  a request that passed 415 and 413:
  `{ format, version, file: { format, version }, ok, reason, message,
  lines: [{ list, text: { ru, en } }], more, counts }`.
  - `file.format` is `daggerheart-loot/lists`, `daggerheart-loot/homebrew`
    or null; `file.version` the file's `version` when it is an integer,
    else null.
  - `reason`: null when `ok`; else `not_json`, `unknown_format`,
    `version`, `empty` or `errors`.
  - `message`: for `not_json`, `unknown_format`, `version` and `empty`,
    the panel's own refusal text in both languages (`t[key].replace('%s',
    version)`, the panels' expression); `unknown_format` joins
    `importNotBundle` and `hbImportNotFile` with one space; else null.
  - `lines`: for `errors`, the error lines; for an `ok` lists file, the
    skip lines; for an `ok` homebrew file, the note lines; each line's
    `text` is `lineText(line)` built once per language; `list` is the
    0-based list index of a lists file's line, null for the file's own
    lines and for every homebrew line. Order: the panel's (a lists
    file's own lines, then each list's lines by list index).
  - `more`: the errors past the first 50 (`ERRORS_MAX`), else 0.
  - `counts`: null unless `ok`; `{ lists, entries, skipped }` for a lists
    file, `{ books, sections, cards, items }` for a homebrew file (the
    `hbImportCounts` numbers).
  - Dispatch: run `parseBundle(text, knows)`; when its reason is
    `notBundle`, run `parseHomebrew(text, ctx)`; when that reason is
    `notHomebrew`, the answer is `unknown_format`.
  - Names: a lists line names its entry by item id only (default (a),
    owner AFK, plan-B2a-5): the builders take a name lookup, the app
    passes its index, the API passes none; a homebrew line names its
    object from the file itself, as the panel does.
- Bounds, each a 400 `bad_request` naming the field (the CONTRACTS
  rule; the message never echoes the value): `q` at most 200 characters
  (string length) and 8 terms; `limit` an integer 1-50, default 20;
  `kind` one of `item consumable weapon secondary armor`; `tier` one of
  `1 2 3 4 A C`; `rarity` one of the five rarities (`alt.ts`
  `RARITIES`); `source` an id of the codes list; `table` an id that
  `tableOf` resolves; at least one of `q` and the five facets (400
  naming `q`); `filter` at most 512 characters and starting with `f_`.
  `too_broad` (400): "The query q matches too many records to rank. Add
  a longer word or a filter (kind, source, table, tier or rarity)." The
  file: `Content-Type: application/json` else 415; past 32768 B as UTF-8,
  413 `too_large` "The file is past 32768 bytes. Check a longer file in
  the app's import, which reads up to 5 MB."; one function builds that
  error, and both the REST read and `runOperation` (the MCP path) call
  it.
- MCP: `search_catalog` takes the REST parameters as arguments; an
  `integer` parameter (`limit`) takes a JSON integer, every other a
  string. `check_file` takes one argument `file`: the file's text as a
  string (default taken (owner AFK); not an object, and not both: the
  file is the text the reader saves, the byte cap is on that text, and a
  union type is a schema some clients may refuse). The operation carries
  `"x-mcp-body-argument": "file"`; the adapter's generic rule makes the
  property from it (no case by tool name).

Files expected:
- `tools/api-data.mjs`, `tools/api-data.test.mjs`
- `preview/api/service.mjs`, `preview/api/rest.mjs`, `preview/api/mcp.mjs`,
  `preview/api/openapi.json`, `preview/api/api.test.mjs`,
  `preview/api/mcp.test.mjs`
- `app/src/lib/data.ts` (`facetsOf`), `app/src/lib/data.test.ts`
- new `app/src/lib/importReport.ts`, `app/src/lib/importReport.test.ts`,
  `app/src/lib/homebrewReport.ts`, `app/src/lib/homebrewReport.test.ts`
- new `app/src/components/importLines.test.ts` (the `lineText` parity)
- `app/src/components/ImportPanel.svelte`, `HomebrewImport.svelte`,
  `TablesPage.svelte` (call the extracted code; no markup change)
- `tools/check-site.lib.mjs`, `tools/check-site.test.mjs` (two
  `--preview` probes)
- `docs/fixtures/api/v1/` (new answer fixtures; the others may move only
  in `data_version` and ETags), `docs/fixtures/mcp/` (two `tools/call`
  fixtures; every fixture that holds the tool list, `instructions` or
  `serverInfo.version` re-pinned), `tests/contracts.js`
- `docs/specs/CONTRACTS.md` section 6, `docs/specs/ROUTES.md` (one line,
  "Filter grammar"), `docs/specs/META.md` section 3 (the files kept in
  memory, if it lists them), `docs/specs/COVERAGE.md`, `llms.txt`,
  `.claude/README.md` ("The CI deploy", "Preview host", "CPU readings to
  take")
- new D10 under `docs/decisions/`, `docs/DECISIONS.md` (`node
  tools/decisions.js`)

Steps:

1. Gate on landing 2's readings (`handoff.md`, "After B2a"). Take the
   production factor f as the larger of: the cold `std` roll's p50 over
   1.170 ms, and the cold record read's p50 over 0.310 ms (the local cold
   medians of B2a; the dashboard values read as microseconds). If f is
   above 5.5, or a landing-2 pass line failed, stop and hand back to the
   planner: at 3x the search's cold path (about 1.8 ms here) would pass
   10 ms.
2. Projections (`tools/api-data.mjs`). Add `searchFiles(catalog)` (the
   index and the shards, from `catalog.records` and the versions),
   `fileCheckFile(loot, index)`, and `f` in `rowOf` for a table with
   groups. Add `BUDGET.search = 262144`; `budgetOf` gives it to
   `apidata/search/<n>.txt` and `small` to `apidata/search/index.json`
   and `apidata/file-check.json`. `render()` stamps the shard head as it
   stamps a chunk head (a `SEARCH_PATH` beside `CHUNK_PATH`). The CLI
   line and `--check` also print the shard count.
3. `rest.mjs` `readCapOf`: 262144 for `apidata/search/*.txt` (the test
   "is read by the worker with a cap at least as large as the budget"
   covers it).
4. `app/src/lib/data.ts`: `export function facetsOf(table: TableId): (it:
   Record_) => Record<string, string | readonly string[]>`, which returns
   `equipFacets` for an `EQ_TABLE` table, else `plainFacets`.
   `TablesPage.svelte`'s `valueOf` becomes `(it, g) =>
   facetsOf(table)(it)[g] ?? ''` (the section 3.8 promise, plan-B2a-N10);
   the build's `f` calls it. A `data.test.ts` case: each `TABLE_IDS`
   table maps to the function the page used.
5. Report builders, moved from the components with their helpers, text
   unchanged:
   - `app/src/lib/importReport.ts`: `listsErrorReport(errors, names, t,
     nameOf)` (returns `{ file, lists: [{ index, head, lines }] }`, the
     `refused` derivation), `skipLine(s, t, nameOf)`, `listsRefusal(p)`
     (the `read()` mapping to `{ key, version? }`), and `lineText(l)`:
     `pos`, then `, ` and `name (item)`, `item` or `name` when either
     exists, then `: `, then `text`, then ` ` and `path` when it exists
     (the `ImportLines.svelte` snippet). `nameOf` is `(id) => string |
     undefined`; the panel passes `(id) => { const it =
     app.index?.byId.get(id); return it ? nameOf(it, app.lang) : undefined
     }`.
   - `app/src/lib/homebrewReport.ts`: `homebrewErrorLines(errors, doc,
     names, t, lang)`, `homebrewNoteLines(notes, file, t, lang, from)`,
     `homebrewRefusal(p)`, with `limitOf`, `valueAt`, `placeOf` and the
     `POS`, `MANY`, `FILE_MAX`, `TEXTS` tables.
   - Each module keeps its own `fill`: the lists one reads `%f %l %n %s
     %v`, the homebrew one `%f %n %s %v`; do not merge them (a merge
     changes what a `%l` in a homebrew text does).
   - The components import the builders and drop their inline copies;
     their markup and their tests do not change.
   - `homebrewReport.ts` is imported only by `HomebrewImport.svelte`
     (the lazy chunk) and the worker, never by the main bundle.
6. `GET /api/v1/records`, operation `searchRecords`, tool
   `search_catalog`: `rest.mjs` `parseSearch(query)` checks the bounds
   above; `service.searchRecords(input)` runs the design above; the
   answer `{ format: "daggerheart-loot/api-search", version: 1,
   data_version, total, rows }` with `ETag` and `Cache-Control: public,
   max-age=300`.
7. `filter` on `GET /api/v1/tables/{table}`: `service.getTable(id, part,
   filter)` as the design says.
8. `POST /api/v1/file-checks`, operation `checkFile`, tool `check_file`:
   `rest.mjs` checks the media type (415, message "The body must be
   application/json: send the file itself."), reads the body with
   `readText(request, 32768)` (413 by the shared function), and passes
   the text unparsed; `service.checkFile(text)` runs the dispatch above,
   the builders of step 5 with `dict('ru')` and `dict('en')`, and answers
   with `Cache-Control: no-store`.
9. Adapters: `runOperation(service, op, { param, query = {}, body = {},
   file })`, where `query` is an object of strings (`query.part`
   replaces the `part` argument; `query.filter`; the search parameters).
   REST builds it from each operation's query parameter names in
   `openapi.json`; the length-1 routes gain `records` (`GET, HEAD,
   OPTIONS`) and `file-checks` (`POST, OPTIONS`). `mcp.mjs`
   `checkArguments` checks an argument by its parameter's schema type
   (`integer`: `Number.isInteger`, then `String(value)` into `query`;
   else a string) and, for an operation with `x-mcp-body-argument`,
   requires that argument as a string (400 "The field file is required.
   Send the file's text as a string."); `buildTools` adds the property
   `file` (`type: "string"`, the request body's description) to
   `required`.
10. `openapi.json` `1.2.0`: `/api/v1/records` (before
    `/api/v1/records/{id}`, so `tools/list` reads `list_rolls`, `roll`,
    `list_tables`, `get_table`, `search_catalog`, `get_record`,
    `get_homebrew_item`, `get_shared_list`, `check_file`), the `filter`
    parameter, `/api/v1/file-checks` last; schemas `Search`, `SearchRow`,
    `FileCheck`, `FileCheckLine`; `too_broad` wherever the document lists
    the codes; the descriptions say what the departures below say (names
    and facets only, `too_broad`, item ids without names, `unheld`
    without an account); one sentence on the two tools in
    `x-mcp-instructions` (at most 600 characters in all, the test's cap).
    The OpenAPI `ETag` then starts `1.2.0-`: the orchestrator updates
    live check 1's expected value (as R2 of `reviews/B2a.md`).
11. Specs and docs: `CONTRACTS.md` section 6 (the rows, the formats, the
    caps of section 11, `too_broad` in the code table, the tool table,
    the fixture names); `ROUTES.md` "Filter grammar": one line that the
    read API's `filter` takes this segment; `META.md` section 3 when it
    names the files kept in memory; `COVERAGE.md` rows for the new files;
    `llms.txt` "The read API (v1)" (the two operations and `filter`, a
    `curl` each) and "The MCP endpoint" (nine tools); `.claude/README.md`
    "The CI deploy" (the file count today and at 3x), "Preview host" (the
    262144 B read cap of a search shard), "CPU readings to take" (the
    step 12 cases); D10 with its rejected options; `node
    tools/decisions.js`.
12. Tests and fixtures:
    - `tools/api-data.test.mjs`: every record on exactly one shard line;
      the codes decode to the record's `source`, `kind`, `table`, `tier`
      and `rarity`; no name holds a TAB or a newline; `foldQuery` is
      idempotent on every name; every budget today and at 3x (the 3x
      diagnostics print the shard count and sizes); `f` equals
      `facetsOf(table)` cut to the groups; `file-check.json` answers what
      the app's `context()` answers for every catalog set, ref and line.
    - The parity tests, run over the files `renderApiData` renders (the
      service with in-memory `assets` and `text`): for 20 queries (Russian
      and English word forms, words in any order, a quoted phrase, `яд`,
      `zweihander`, an apostrophe, a query with a facet), the ids and
      `total` equal `rankHits(every record, parseQuery(q), undefined,
      namesHay)` in the same order; for each `eq_*` part and one value of
      each of its groups, and each plain table with groups, the rows equal
      the app's `passes` over `facetsOf`; each row equals the record v1
      cut to the row's fields.
    - `preview/api/api.test.mjs`: each bound and its 400, both
      `too_broad` caps (a stub shard with 301 kept lines; one with 3001
      positions), the facet-only order, a shard head of another data
      version (one re-read, then 503), 304 on a matching `ETag`, `f`
      stripped with and without `filter`, a `filter` without `f_` (400),
      the file-check cases (each `reason`, 413 at 32769 B before the
      parse, 415, an empty body as `not_json`, the `unheld` skip without
      an account, `more` past 50 errors).
    - `importReport.test.ts`, `homebrewReport.test.ts`: each error kind,
      rule and refusal, ending with the RU and EN texts;
      `importLines.test.ts`: for a line of each shape, the drawn `li`'s
      text equals `lineText(line)`; `expectNoA11yViolations` at the end.
    - `preview/api/mcp.test.mjs`: nine tools in that order; `limit` as an
      integer and as a string (400); `file` missing or not a string
      (400); a 32769 B `file` is the `too_large` `isError` result;
      `content[0].text + '\n'` equals the REST body for both tools.
    - Fixtures `records-q.json` (a Russian and an English word form),
      `records-facets.json`, `error-records-q-missing.json`,
      `error-records-too-broad.json`, `table-eq_weapon-2-filter.json`,
      `file-check-lists-ok.json`, `file-check-lists-errors.json`,
      `file-check-homebrew-errors.json`, `file-check-unknown-format.json`,
      `error-file-check-too-large.json`; MCP `tools-call-search.json`,
      `tools-call-check-file.json`; `tests/contracts.js` compares them.
    - `tools/check-site.lib.mjs` `--preview`: `GET
      /api/v1/records?q=sword` 200 with `format` `api-search`, and `POST
      /api/v1/file-checks` of a one-list lists file 200 with `ok` true.
13. Measure here before the commit (a scratchpad script, not
    committed; the planner's scripts are the model): the search's cold
    prepare and its worst accepted warm query over the step 12 sample at
    today's size and at 3x, and `parseBundle` and `parseHomebrew` at
    32768 B with the builders (`process.cpuUsage()`, as B2a did);
    the worker's gzip size before and after (`npx esbuild
    preview/public/_worker.js --bundle --format=esm --minify` to the
    scratchpad, then gzip); write the numbers into the handoff.
14. After landing 3 (the orchestrator, not a commit): the B2a method
    (curl from the shell, no `Origin`; one warm-up recorded as the cold
    reading of its case; a new bucket; a burst of 10, 1 s apart, each
    status recorded; a bucket count other than 10 repeats the burst;
    p50 for the cost model, p99 for the limit). Cases, 3 minutes apart:
    (a) 10 `GET /api/v1/records?q=<two Russian words>`, each a
    different query; (b) 10 `GET /api/v1/records?kind=weapon&tier=2&limit=50`;
    (c) 10 `POST /api/v1/file-checks` of a 32768 B homebrew file with the
    longest texts; (d) the same with a 32768 B lists file; (e) 10 MCP
    `tools/call` `check_file` with the homebrew file of (c) (the envelope
    parse included, plan-B2a-R4). Pass: each p99 and each cold reading at
    most 5 ms, every status as expected, no error and no exceeded-CPU
    count. A search case above 5 ms: the search fallbacks below. A file
    check above 5 ms: the cap stays 32768 B (a cap never falls), and the
    Edge Function option of section 3.2 goes to the owner. The closeout's
    cap raise reads case (c) (B5b placed line 3).

Acceptance criteria:
- Step 1's gate holds (f at most 5.5, the landing-2 pass lines met), or
  the batch stopped there.
- `GET /api/v1/records` finds a record by a Russian and an English word
  form, words in any order and a quoted phrase, in `rankHits` order;
  without `q` it answers in catalog order; it never matches a
  description or a stat line.
- The 20-query parity holds today and at 3x: the same ids, order and
  `total` as `rankHits` with a names-only Hay over every record.
- Each bound answers its 400 naming the field; past 300 kept lines or
  3000 anchor positions the answer is 400 `too_broad`; no answer echoes a
  value.
- A search reads the cached index and at most 3 shards at 3x; each shard
  is within 262144 B today and at 3x; the index and `file-check.json`
  within 65536 B.
- `filter` narrows a table as the tables page does for the same `f_`
  segment; `f` never reaches an answer; every table file stays within
  131072 B at 3x with `f`.
- `TablesPage.svelte` reads facets through `facetsOf`; the build's `f`
  calls it.
- `POST /api/v1/file-checks` answers the panels' own lines and refusal
  texts in both languages for both file kinds, `unknown_format` for
  another format, 413 past 32768 B before the parse, 415 for another
  media type; `check_file` answers the same bytes, and a 32769 B `file`
  is the same `too_large` as an `isError` result.
- The report builders live in `lib/`; the components call them and no
  inline copy is left; the component tests pass unchanged; `lineText`
  equals what `ImportLines.svelte` draws for each line shape.
- `tools/list` lists nine tools in the order of step 10; `search_catalog`
  and `check_file` return the REST answers.
- `openapi.json` is 1.2.0; `CONTRACTS.md` section 6, `ROUTES.md`,
  `COVERAGE.md`, `llms.txt`, `.claude/README.md`, the fixtures,
  `tests/contracts.js` and D10 match the code.
- The step 13 numbers are in the handoff; the worker's gzip size is
  recorded before and after.
- After landing 3: the step 14 readings are written down and pass, or the
  named fallback is the next batch.

Verification commands:
- `node tools/build.js`
- `node --import ./tools/ts-hooks.mjs --test --test-reporter=dot preview/worker.test.mjs preview/api/api.test.mjs preview/api/mcp.test.mjs tools/api-data.test.mjs`
- `node --test --test-reporter=dot tools/check-site.test.mjs`
- `npx vitest run app/src/lib/data.test.ts app/src/lib/importReport.test.ts app/src/lib/homebrewReport.test.ts app/src/components/importLines.test.ts app/src/components/importPanel.test.ts app/src/components/homebrewImport.test.ts`
- `node tests/derived.js`; `node tests/run-all.js contracts,dataint`
- `rtk npm run check:fast` (Bash timeout 600000; the component reach makes
  it about 11-14 min)
- Push; CI's green run of the tip is the full gate.

Standing checks:
1. Scale: no screen draws differently (the three components keep their
   markup and text; their unchanged tests prove it), so no States table.
   API limits:

| Case | Today | At the limit / one past | At 3x |
|---|---|---|---|
| search rows | at most 50 (about 12 KB) | `limit` 50 / 51 is 400 | the same |
| kept lines with `q` | `меч` 37 and `яд` 13 answer; the fragment `ка` (318) is refused | 300 / 301 is `too_broad` | every real word of the sample answers (`context.md`) |
| anchor positions | the letter `а` (4744) is refused | 3000 / 3001 is `too_broad` | the same rule |
| `q` | - | 200 characters and 8 terms / one more is 400 | the same |
| search shards | 1 file, 204,426 B | 262144 B a file | 3 files, at most 262,108 B |
| table file with `f` | eq_weapon tier 3, 39,493 B | 131072 B | about 118,479 B |
| file check | at most 50 lines and `more` | 32768 B / 32769 B is 413 | the same (no catalog growth in the cost) |
| files of the deploy | +3 (index, 1 shard, `file-check.json`) | - | +5; the margin falls from about 96 to about 91 |

2. Error scenarios: no screen change, no write path, no stored shape. A
   failed index or shard read is 503; a deploy between two reads gives
   one re-read, then 503 (test); a file check reads no Supabase, so a
   Supabase outage does not reach it or the search; a stale isolate keeps
   its prepared shards for 10 minutes, as every cached file. The import
   panels keep their behavior (the unchanged component tests). A revert
   of B3: the two paths answer the JSON 404 again and `filter` is ignored
   (a client then gets the whole table); nothing stored is touched.
3. Consistency (`FEATURES.md`, "Consistency rules" 4, 14 and 17): one
   name for one thing (a row's fields are record v1's fields of the same
   names; the tools are named for their operations), RU and EN with the
   same facts, and a handed-out link carries `?v` as the record's does.
   The search follows `#/search`'s word rules and ranking on names.
   Departures, named:
   no description or stat-line match (D10); `too_broad` where `#/search`
   shows everything; no own items. The filter is the tables page's. The
   file check's lines and refusals are the import panels' own;
   departures, named: no account, so a homebrew entry without a snapshot
   is `unheld` and the panels' held-name lines are absent; a lists
   line names its entry by item id, where the panel adds the record's
   name.
4. RU/EN parity: every `text` and `message` is a `dict.ts` pair through
   the shared builders; no new `dict.ts` string (`unknown_format` joins
   two existing pairs); error messages and `openapi.json` are English;
   ASCII punctuation in the new English text.

Risks / do-nots:
- Do not parse a whole-catalog JSON projection per request, and do not
  read `names.json` or `cards.json` in a search or a file check.
- Do not fold text at request time beyond the query: the shards hold
  folded names.
- Do not raise a cap in this batch, and keep `FILE_MAX_BYTES` and the
  panels' own 5 MB rule.
- The worker bundle grows by `bundle.ts`, `homebrewFile.ts`,
  `homebrew.ts`, `search.ts` with the two Snowball stemmers and the two
  report modules; step 13 records the gzip size (the Workers free-plan
  limit is 3 MB compressed, Cloudflare documentation, not verified in
  this pass).
- The app bundle budget (276 kB, 275.2 kB used at B2a): the extraction
  moves code and must not pull a new import into the main chunk; if
  `check:fast`'s budget step fails, find the import first, and raise the
  budget only as `.claude/README.md` says.
- `stemOf` caches every word it stems in module memory; in the worker
  that cache is bounded by the catalog's words and the queries of one
  isolate's life.
- At 3x the cold search is about 1.8 ms here (prepare 0.9-1.2 ms, the
  worst accepted query 0.5-0.6 ms), about 7.6 ms at B1's p50 factor of
  4.2: inside 10 ms, with little room; step 1 and step 14 decide.

Fallbacks (named, in order; same contract): if a search case of step 14
fails, or the catalog passes twice today's records before a reading at
that size: (1) store each display name as a capitalization delta against
its folded name (a build-time encoding with a round-trip test over every
name), about 40 % less text to decode cold; (2) list each shard's code
sets in the index and read only the shards a `table` or `source` facet
can match.

Review: required (trigger: a public contract - two operations, the
`filter` parameter, two tools, two answer formats, an error code). Gate
cost: `check:fast` 11-14 min, one CI run 15 min, the batch review about
15 min: about 45 min (landing 3 and step 14 are counted in B2b).

### B2b - The two pages, the footer, the import links (implement-ready)

Objective: a plain-language user page "With AI assistants" and a
developer page "API", both static and bilingual; their links in the
footer, the READMEs, `llms.txt` and the two import panels (owner notes of
2026-11-12, `ai-mcp-docs-page.md` items 1-7b).

Split criterion: a different route and filter set (static pages, the app
footer and the import panels: the component suites, the browser suites
and every golden that shows the footer), apart from B2a's and B3's
worker contract. It follows B3 so that the developer page lists every
operation once.

Writer: no open design question. The clients' connection steps are not
in this plan on purpose: step 2 verifies them against each client's
official documentation at implementation time.

In scope: the two pages in both languages, `tools/build-pages.js`
`PAGES`, the footer links, the import panel links and hint, the
`llms.txt` links, the README links, the Russian-credit test (placed from
Deferred: the same files). Out of scope: the export-flow pointer (B5b,
placed there), any app route, the account screens.

Files expected:
- new `pages/src/ai.html`, `pages/src/en/ai.html`,
  `pages/src/developers.html`, `pages/src/en/developers.html`;
  `tools/build-pages.js` (`PAGES` rows; the generated `pages/*.html` as
  the build writes them)
- `app/src/components/Shell.svelte`, `app/src/components/shell.test.ts`
- `app/src/components/ImportPanel.svelte`, `HomebrewImport.svelte`,
  `importPanel.test.ts`, `homebrewImport.test.ts`
- `app/src/lib/dict.ts` (both languages)
- `tests/contracts.js`, `tests/derived.js` (the credit sentence)
- `README.md`, `README.ru.md`, `llms.txt`
- new `app/src/components/ImportFileRow.svelte` and its test (the file
  row both import panels draw; plan-B2a-N9)
- `tests/app/states.js` (the footer links assertion; plan-B2a-R5)
- `tools/collect-site.sh` (the guard's page list; plan-B2a-N13)
- `tests/app/snapshots/*` (re-seeded goldens), `docs/specs/FEATURES.md`
  ("Chrome": the footer row), `docs/specs/I18N.md` if it lists the
  pages, `docs/specs/COVERAGE.md`

Behavior and UI constraints:
- User page `ai` ("С ИИ-ассистентами" / "With AI assistants"), plain
  language, no jargon, in this order: what you can ask (roll loot, find
  an item, read an item's text, check a list or homebrew file, read a
  shared list by its link; later your own lists and items, with your
  grant on `#/account`); connect in three steps, one block per client:
  Claude (web and desktop), ChatGPT, Cursor, Claude Code, each with the
  URL `https://daggerheart-loot.pages.dev/mcp` and a link to the client's
  own help page; what it can and cannot do (reads only; no account for
  public data; account access only after your grant, revocable, when it
  ships); privacy and fair use in two sentences with a link to
  `privacy.html`; three to five example prompts in each language; one
  sentence on `llms.txt` ("assistants read this file; it also holds the
  import file formats") with its link; how to create a list or items (ask
  the assistant for a file and import it on the Lists page or «Мои
  предметы»).
- Developer page `developers` ("API для разработчиков" / "API for
  developers"; the footer link reads "API"): base URL, no key, CORS, fair
  use and the quota, the v1 freeze, the record format and `rights`, every
  operation of `openapi.json` with a copyable `curl`, the error envelope
  and codes as a table, `ETag` and caching, the bulk catalog mirror
  recipe, links to `openapi.json` and to the Redoc view
  (`https://redocly.github.io/redoc/?url=https://daggerheart-loot.pages.dev/api/v1/openapi.json`,
  the link the owner's posts use), the `llms.txt` pointer, one MCP
  paragraph that links the user page, one sentence that account reads
  are planned.
- Both pages use the template of `tools/build-pages.js` (no app bundle
  cost) and follow the privacy pages' RU/EN parity: the same facts in the
  same order.
- Footer (`Shell.svelte`): two links after "Условия использования" /
  "Terms of use": "ИИ-ассистенты" / "AI assistants" (`ai.html`) and "API"
  (`developers.html`), through `app.pagesDir` like the others; if the
  static page template draws the same nav, the same two links go there.
- Import panels (owner revision 7b): each panel's file row holds two
  links, "Формат файла" / "File format" (its schema) and "ИИ-ассистенты" /
  "AI assistants" (`app.pagesDir + 'ai.html'`, as the footer link, so the
  English UI opens `pages/en/ai.html`; plan-B2a-N8), both
  `target="_blank" rel="noopener"`. Both panels draw the row through one
  new component, `ImportFileRow.svelte` (the `ImportFile` button and the
  `.links` span; props: the schema `href`, the file name and the pick and
  read callbacks the panels pass today); the inline copy in
  `HomebrewImport.svelte` goes (`CLAUDE.md`: extract shared UI on its
  second real use; plan-B2a-N9).
  `HomebrewImport.svelte` keeps its row (the `llms.txt` link becomes the
  user page). `ImportPanel.svelte` takes the same row shape (`.filerow`
  and `.links`, as the sibling My items panel draws it) and its hint loses
  its inline links. Default taken (owner AFK): the lists panel follows the
  My items panel's row so the two siblings match. New hint texts: lists
  "Файл JSON из «Скачать JSON», архив ZIP из «Скачать мои данные» или
  файл, собранный ИИ-ассистентом. Списки добавятся как новые;
  существующие не изменятся." / "A JSON file from "Download JSON", the
  ZIP archive from "Download my data", or a file an AI assistant built.
  The lists are added as new ones; existing lists stay as they are.";
  homebrew `hbImportFits` "Подходит файл из «Скачать JSON», архив из
  «Скачать мои данные» или файл, собранный ИИ-ассистентом." / "Takes a
  file from "Download JSON", the archive from "Download my data", or a
  file an AI assistant built." The validation messages that say "сверьте
  с описанием в llms.txt" keep `llms.txt` as plain text. `dict.ts`: one
  pair of keys for the two shared link texts (`importFormat`,
  `importAi`), replacing `hbImportFormat`, `importSchema`, `importLlms`,
  `importHintBefore`, `importHintMid`, `importHintAfter` by one
  `importFits` (search every use first: `git grep -n -E
  "hbImportFormat|importSchema|importLlms|importHint"`).
- Do not link a page before it exists: the pages and every link to them
  are in this one commit.

Steps:

1. Pages: add the `ai` and `developers` rows to `PAGES` in
   `tools/build-pages.js` (titles and descriptions in both languages);
   write the four `pages/src/` fragments; run `node tools/build.js`.
2. Verify the connection steps of each client against its official
   documentation on the day (WebFetch): Claude's custom connector help
   page (support.claude.com), OpenAI's ChatGPT developer mode / connectors
   help page, Cursor's MCP documentation (cursor.com docs), and Claude
   Code's MCP documentation (docs.claude.com, `claude mcp add --transport
   http`). Write only what the page says, the plan names a client's plan
   only as the page states it, and list each URL with its fetch date in
   the handoff. A client whose page cannot be read or does not take a
   remote URL with no sign-in: leave its block out and say so in the
   handoff; never write steps from memory.
3. Footer: `Shell.svelte`, `dict.ts` (`aiLink`, `apiLink` in both
   languages), `shell.test.ts` (both links, their `href`, both languages,
   axe at the end); `FEATURES.md`, "Chrome".
4. Import panels as the constraints say; `importPanel.test.ts` and
   `homebrewImport.test.ts` assert both links, their `href` and target,
   the new hint text in both languages, and that no `/llms.txt` link is
   left in either panel; axe at the end. `ImportFileRow.svelte` gets its
   own test (both links, the English `pages/en/ai.html` href, axe at the
   end).
5. Links elsewhere: `README.md` and `README.ru.md` link both pages (beside
   the read API mention); `llms.txt` links both pages in its first
   "Read this first" item and in "The MCP endpoint"; the developer page
   links `llms.txt` and `openapi.json`.
6. Tests (`tests/contracts.js`): every method and path of `openapi.json`
   appears as `<METHOD> <path>` in both developer pages; both user pages
   hold `info["x-mcp-endpoint"]` and no other `/mcp` URL; `PAGES` holds
   both ids. `tests/derived.js` (placed from Deferred): the English
   Russian-credit sentence is the same in `README.md`, `LICENSE`,
   `llms.txt` and the English `footBefore`, and the Russian one the same in
   `README.ru.md` and the Russian `footBefore`; read the current copies
   first, and if they differ, align them to the `dict.ts` wording and say
   so in the handoff. `tests/app/states.js`: the assertion that `.foot-nav
   a` equals `['/pages/install.html', '/pages/privacy.html',
   '/pages/terms.html']` gains `/pages/ai.html` and
   `/pages/developers.html` (plan-B2a-R5). `tools/collect-site.sh`: the
   guard's list of published pages names `pages/ai.html`,
   `pages/en/ai.html`, `pages/developers.html` and
   `pages/en/developers.html`, so a missing page fails the deploy
   (plan-B2a-N13).
7. Goldens: `npm run build:test`, then re-seed the states whose text
   changed (every state that shows the footer or an import panel) with
   `MSYS_NO_PATHCONV=1 node tests/app/golden.js --update` by shard, or
   take CI's text (`.claude/README.md`, "CI credit"); read `git status --
   tests/app/snapshots` and check that only the footer row and the import
   panel rows moved.

Acceptance criteria:
- `pages/ai.html`, `pages/en/ai.html`, `pages/developers.html` and
  `pages/en/developers.html` exist with the contents above; RU and EN hold
  the same facts in the same order.
- Each client block was checked against the official page on the day,
  and the handoff lists each URL with its date.
- The footer shows the two links on every app screen in both languages;
  the import panels show "Формат файла" and "ИИ-ассистенты" (and their
  English twins) and the new hints; no panel links `/llms.txt`.
- The README, `llms.txt` and developer-page links exist; the two
  `tests/contracts.js` tests pass.
- The Russian-credit sentence test holds the five copies (placed from
  Deferred).
- The goldens are re-seeded, and only the footer and import rows moved.
- Both panels draw their file row through `ImportFileRow.svelte`, and the
  "AI assistants" link goes through `app.pagesDir`.
- `tests/app/states.js` asserts the five footer links; the
  `collect-site.sh` guard names the four new pages.

Verification commands: `node tools/build.js`; `npx vitest run
app/src/components/shell.test.ts app/src/components/importPanel.test.ts
app/src/components/homebrewImport.test.ts
app/src/components/importFileRow.test.ts`; `node tests/derived.js`;
`node tests/run-all.js contracts,dataint`; `rtk npm run check:fast`
(`dict.ts` and `Shell.svelte`: about 11-14 min); `npm run build:test`
then the golden re-seed and `node tests/run-all.js app/states` (past the
600 s foreground cap: run it in the background, or leave it to CI's
`browser` matrix); `npm run check:built`; push, CI.

Standing checks:
1. Scale (States table):

| State | What the screen shows | Proof |
|---|---|---|
| footer at 360 px | five links (install, privacy, terms, AI assistants, API) wrap onto two rows; no horizontal scroll | golden at 360, `tests/app/sweep.js` 360 |
| footer at 1180 px | one row | golden, sweep 1180 |
| footer in the installed app | four links (no install link) | `shell.test.ts` |
| lists import panel at 360 px | the file button, then the two links in one row (the My items panel's wrap) | golden, sweep 360 |
| My items import panel at 360 px | unchanged layout, the second link renamed | golden |
| either panel at 1180 px | one row | golden |
| static pages at 360 and 1180 px | the template's layout; long `curl` lines scroll inside their code block, not the page | `check:built`, a manual look in the handoff |
| empty, one, many, the limit, 3x | not applicable: the pages and links show fixed content | - |

2. Error scenarios: static pages and links; no read, no write, no stored
   shape. Offline, a static page opens from the service worker's cache
   only if the worker caches `pages/` today (unchanged). A stale tab keeps
   the old footer until it reloads; harmless.
3. Consistency: the footer row keeps one name per page ("ИИ-ассистенты"
   everywhere: footer, panels, page title "С ИИ-ассистентами"); the two
   import panels now share one file-row component and the same two link texts
   (a FEATURES.md rule: one name for one thing); the pages follow the
   privacy and terms pages.
4. RU/EN parity: every new string has both languages with the same facts;
   no plurals; ASCII punctuation in English, the Russian text keeps «».

Risks / do-nots: no client step from memory; no `/llms.txt` link left in
the panels; no change of the validation message texts; no link to a page
in a commit that does not hold the page.

Review: required (trigger: new and changed UI; `llms.txt`, a public
contract file). Gate cost: `check:fast` about 14 min, the golden re-seed
about 10-20 min locally (or a second CI run of 15 min with CI's text),
`check:built` a few minutes, `app/states` about 10-15 min in the
background (or CI's `browser` matrix), one CI run 15 min, the batch review
about 15 min, landing 3 about 23 min, B3's readings about 10 min: about
105 min.

Closeout lines placed now (the closeout's acceptance, with B5b):
- Raise the file-check cap to 65536 B only if landing 3's 32 KB reading is
  at most 3 ms p99; otherwise keep 32768 B and say so in the closeout.
- Post the follow-up on issue 72 and close it once the account-level read
  is live (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2).

### B4 - dropped (2026-11-10)

- Was the Charkeeper mapping or `format=charkeeper-v1`; owner Q1 removes
  both, and no gate waits on the author. What remains: the field checks
  of sections 5.3 and 8, the announcement (an owner step), additive
  fields later (section 11). The id B4 is not reused.

### B5 - The account tier (design settled 2026-11-11; two batches)

Facts: `context.md`, "B5 design facts (2026-11-11)" (the token, the
account writes that exist, what a client token reaches). A client token
works at PostgREST directly, so the database, not the worker, bounds it
(D7). B5 needs one migration (B5a) and no new table: the head pattern
needs no tombstones, and one grant level needs no client table.

Split criterion: B5a is a different route and filter set (an app route
and screen, browser suites, goldens, `check:db`); B5b is a public-contract
change of its own (the account API and `/mcp/me`, stub tests only). B5a
goes first: the guard must hold before a client token can exist. Both
land with the closeout squash (D6); the owner switches the production
OAuth server on after it (B5a step 8). The plan review before B5a covers
both (Status).

#### B5a - The account connection (implement-ready outline; Open design question: the screen layout)

Open design question: the layout of the consent page and of the
"Connected apps" section, a mock grounded in `#/account` (its connected
providers section is the sibling) under `issues/ai-mcp/mocks/`; a planner
refresh draws it when B5a is next. Behavior, states and string facts
below are settled.

Objective: a reader connects an app or AI assistant through the Supabase
OAuth 2.1 server, sees and disconnects it on `#/account`, and the
database bounds every client token to the API's account scope; D7.

Steps:

1. Measure on the test project (the owner switches "OAuth Server" on,
   authorization path `/connect`, dynamic registration on), with the auth
   settings of `supabase/config.toml` pushed to it: a token from the flow
   with a seeded account. Record its claims (`email`, `phone`,
   `app_metadata`, `user_metadata` with the provider name and picture;
   plan-B5a-R5); whether a `resource` parameter is accepted and changes
   `aud`; whether PostgREST still accepts the access token after
   `revokeGrant` until `exp` (step 2 refuses it either way); and what the
   client token can do on Auth: `PUT /auth/v1/user` (email; password;
   `data`), `GET /auth/v1/user/identities/authorize` (link an identity),
   `DELETE /auth/v1/user/identities/{id}` (unlink), `POST
   /auth/v1/factors` (enroll), `POST /auth/v1/logout?scope=global`, and
   `GET /auth/v1/user` (which personal fields it answers). Also record
   which of `<SUPABASE_URL>/.well-known/oauth-authorization-server/auth/v1`
   (RFC 8414 path insertion, which MCP clients try) and
   `<SUPABASE_URL>/auth/v1/.well-known/oauth-authorization-server`
   answer, and whether the pinned CLI's `config.toml` has an OAuth server
   section: if it does, the settings (enabled, authorization path
   `/connect`, dynamic registration) go into `supabase/config.toml`, and
   the local stack serves them; if not, step 8 records that `config:push`
   leaves them (plan-B5a-R6). Stop rule: if a client token changes the
   email or the password, links or unlinks an identity, or enrolls a
   factor, stop and return to the owner (a connected app could take or
   lock the account); a global logout and a `data` change are recorded,
   not a stop. This is B5's one owner stop. Also check whether the local
   CLI stack serves the OAuth server; if not, `tests/db` mints client
   tokens (a JWT with `client_id` and a `session_id` whose
   `auth.sessions` row the test inserts, signed with the local JWT
   secret). Results go to `.claude/README.md`, "Supabase configuration".
2. Migration `supabase/migrations/<date>_api_client_guard.sql`:
   `public.api_client_guard()` (invoker), set by `alter role authenticator
   set pgrst.db_pre_request` and `notify pgrst, 'reload config'`, with
   `grant execute on function public.api_client_guard() to anon,
   authenticated, service_role` (the repository's `revoke ... from
   public` pattern would fail every request). With `auth.jwt() ->>
   'client_id'` not null it first refuses a token whose session ended:
   `public.api_client_session_live()`, SECURITY DEFINER, `set
   search_path = public, pg_temp`, `revoke execute ... from public,
   anon`, `grant execute ... to authenticated`, answers whether the
   token's `session_id` has a row in `auth.sessions` (one indexed read per
   client-token request; an app token skips it; plan-B5a-R1). Then it
   allows only (by `request.method`, `HEAD` judged as `GET`, and
   `request.path` by exact equality, `/lists` and not a prefix): `GET` on
   `lists`, `list_entries`, `homebrew_items`, `homebrew_books`,
   `homebrew_cards`; `POST`, `PATCH`, `DELETE` on `homebrew_items`;
   `PATCH` and `DELETE` on `lists`; `POST` on `rpc/apply_list_writes`,
   `rpc/get_homebrew_items`, `rpc/my_limit` (the B5b reads and writes; T0
   reads run as `anon` and pass); else it raises 42501 `api_client_guard:
   not allowed for a connected app`. Restrictive policies on every
   `public` table outside the scope list (`list_shares`,
   `purchase_requests`, `purchase_request_lines`, `list_notices`,
   `print_sets`, `user_prefs` and every other table that `authenticated`
   can select; the step 3 query enumerates them): `create policy
   <table>_no_client as restrictive for all to authenticated using
   ((select auth.jwt() ->> 'client_id') is null) with check ((select
   auth.jwt() ->> 'client_id') is null)`. The pre-request function bounds
   RPCs and the write methods; the restrictive policies bound embedding
   and live in the schema dump. Restrictive policies on `storage.objects`
   refuse a client token's insert, update and delete. The reversal
   `supabase/reversals/<same name>.sql` (`alter role authenticator reset
   pgrst.db_pre_request; notify pgrst, 'reload config';`, drop the
   policies, drop both functions) runs under the up-down-up gate of
   `check:db`. Named fallback, if the probe of the acceptance shows that
   the hosted project refuses or ignores the role setting: a guard call
   at the top of each other RPC `authenticated` may execute, held by the
   same test (the restrictive table policies already bound the tables).
3. `tests/db/api-client-guard.test.mjs`: it enumerates every table and
   function `authenticated` can reach (`pg_class`, `pg_proc` grants) and
   asserts that a client token is refused on each one outside step 2's
   list, and on storage writes; an embedding case from each allowed
   table to each out-of-scope table it has a foreign-key path to (for
   example `lists?select=*,list_shares(*)`) answers empty embedded
   arrays or 403 for a client token, and the full rows for an app token;
   a revoked grant's unexpired token is refused; a client token reads
   and writes its own lists and items and never another account's; an
   app token and `anon` behave as before (the existing suites pass
   unchanged); a deleted account leaves no grant.
4. Ports: an `AppRepository` in `ports/types.ts` (`details(id)`,
   `approve(id)`, `deny(id)`, `list()`, `revoke(clientId)`), in
   `ports/supabase.ts` over `auth.oauth` of auth-js 2.117.1
   (`getAuthorizationDetails`, `approveAuthorization` and
   `denyAuthorization` with `skipBrowserRedirect`, `listGrants`,
   `revokeGrant`), the fake in `fake-cloud.ts` with seeded grants and one
   pending authorization, `cloud.contract.ts` cases.
5. Route `#/connect` (`/connect`, `/en/connect`; `ROUTES.md`, fixtures
   `docs/fixtures/urls/routes.json` and `docs/fixtures/urls/paths.json`):
   its `authorization_id` query stays in
   the address while on the route, so a reload reads it again; signed
   out, the sign-in prompt returns to the same address
   (`dhloot.auth.return`); a build with no sign-in draws the not-found
   page. The page: the client's name and redirect host, the signed-in
   account, the scope sentence ("read, change and delete your lists and
   homebrew items; deleting a list also ends its share links and the
   players' requests on it; deleting an item removes it from every list
   that holds it and deletes its picture. It never changes your sign-in,
   deletes your account, uploads pictures or makes share links."; Russian
   with the same facts: «Читать, менять и удалять ваши списки и предметы
   из «Мои предметы»; удаление списка закрывает и его ссылки, и запросы
   игроков по нему; удаление предмета убирает его из всех списков, где он
   есть, и удаляет его картинку. Приложение не меняет ваш вход, не
   удаляет аккаунт, не загружает картинки и не создаёт ссылки.»; if step
   1 finds `email` or a name in the client token, both add "and your
   account's email and name" / «а также почту и имя вашего аккаунта» to
   what the app reads, plan-B5a-R5), «Разрешить» / "Allow" (primary) and
   «Отказать» / "Deny"; an approve or a deny goes to the client's
   redirect URL.
6. `#/account`: a "Connected apps" («Подключённые приложения») section
   after the connected providers: one row per grant (name, date granted),
   «Отключить» / "Disconnect" behind the app's confirm, then the row
   leaves; an empty line; a failed read with a retry; a failed revoke
   toast.
7. Privacy pages (both): the B5a sentence of section 3.6 with the same
   facts as the step 5 scope sentence (and the email and name when step
   1 finds them), one new "Last changed" date. `FEATURES.md` "Account",
   `META.md` section 3 (the OAuth server, the guard), D7, `node
   tools/decisions.js`.
8. `.claude/README.md`, "Supabase configuration": the dashboard settings
   (or, by step 1, the `config.toml` section; else the fact that
   `config:push` leaves them) and the production order (owner, after the
   closeout squash: the migration applied, `/connect` live, then the
   switch on; then the owner runs the acceptance probe on production).
   "Restore production (owner)" gains a step that re-applies the role
   setting and runs the probe: the nightly backup leaves out roles
   (`.github/workflows/backup.yml`), so a restore drops
   `pgrst.db_pre_request` with no error (the restrictive table policies
   survive in the schema dump; the RPC half depends on this step).
   Revert order: switch the OAuth server off (or revoke every grant)
   before the down migration, which would give client tokens the whole
   account back.

Acceptance: each step 2-6 line holds by its test; every state of the
table below is a `tests/app/inventory.js` entry with a golden; the
component tests end with `expectNoA11yViolations`; step 1's results
(the Auth endpoints, the claims, the discovery URLs, the `config.toml`
section, a revoked token at PostgREST) are recorded and its stop rule
did not fire; after `migrate-test` applies the migration, a client token
from step 1 gets 403 `api_client_guard` from `GET
/rest/v1/print_sets?limit=1` on the test project, and an app token gets
200 (recorded in `.claude/README.md`, "Supabase configuration"); an
embedding from an allowed table to an out-of-scope one and a revoked
grant's unexpired token are refused (test); the placed line of
plan-B1-2-N5 is answered in B5b ("CORS"); privacy pages and D7 exist.

Standing checks:

1. Scale (States; proof: goldens at 360 and 1180 px, component tests):
   consent - loading, details, signed out, no or unknown id (one "this
   request expired; start again in the app" state), already consented
   (redirect, no draw), approve in flight (buttons disabled), failed read,
   failed approve, the longest client name (200 characters, wrapped);
   connected apps - empty, one, many (no limit row exists; 30 rows in the
   test), the longest name, a revoke failure. The primary action stays
   at the bottom of the consent card; nothing sticky.
2. Errors: a failed read shows its retry and stores nothing; a failed
   approve or deny keeps the page and toasts; offline is a failed read; a
   grant revoked in another tab leaves on the next read of the section;
   a stale tab (the previous bundle) has no `/connect` and draws the
   not-found page, and a reload fixes it; a frontend revert draws the
   same, so the owner switches the server off first (step 8); the down
   migration follows step 8's order. No stored data is lost: a revoke
   ends the sessions and refresh tokens, never rows, and the guard
   refuses the app's unexpired access token on its next request
   (step 2).
3. Consistency: section heading, row and confirm follow the connected
   providers section; verbs «Отключить» and «Разрешить» as the app's
   other confirms; toasts as the account page's.
4. RU/EN parity: every string in `dict.ts` in both languages with the
   same facts; both privacy pages; the scope sentence (step 5) names the
   same facts in both languages and both privacy pages: what the app
   reads, changes and deletes, the list-delete cascade, the item-delete
   cascade, and the four things it never does (and the email and name
   when step 1 finds them).

Gate cost about 45 min (`check:fast`, `check:db`, CI with the golden
re-seed). Review: required (a migration; a public contract - the route).

#### B5b - The account API (implement-ready outline)

Objective: `/api/v1/me/` and `/mcp/me` over the service, relaying a
connected app's token, by the sync rule of section 3.4.

| Operation | Rule |
|---|---|
| `GET /me/lists` | heads `{ id, rev, name, entries, updated_at }` (`api-my-lists`) |
| `POST /me/lists` | `{ id, name, money_mode?, player_note?, gm_note? }`; 201; the same id again 200; another account's id 409 `conflict`; past the limit 409 `limit_reached` |
| `GET /me/lists/{id}` | `api-my-list`: the list fields and `entries` (`id`, `key`, `origin`, `record_id`, `quantity`, `price_coins`, `player_note`, `gm_note`, `gm_only`, in list order); `ETag: "<rev>"`; records come from T0 reads or `?ids=` |
| `PATCH /me/lists/{id}` | `name`, `money_mode`, notes; an optional `If-Match`: a direct `lists` update with `eq('revision', r)` and the read-back rule of `homebrewUpdate` (412 with the current `ETag` when the revision moved; the guard allows `PATCH` on `lists`); without `If-Match`, last writer wins, as the app (`apply_list_writes` `update`) |
| `DELETE /me/lists/{id}` | `If-Match` required (428 without); `delete ... revision = r`; 204; gone 204; moved 412 with the current `ETag`; the delete also deletes the list's share links, the players' requests and its notices (`on delete cascade`) |
| `POST /me/lists/{id}/entries` | `{ entries: [{ id, record_id, quantity?, price_coins?, player_note?, gm_note?, gm_only? }] }`, 1-100, the `add` op the app builds (`lib/cloudLists.ts`); a retry is idempotent |
| `PATCH`, `DELETE /me/lists/{id}/entries/{entry}` | the entry fields, last writer wins; a delete of a gone entry is 204 |
| `GET /me/homebrew-items` | heads `{ id, key, rev, updated_at }` (`api-my-items`); `?ids=` (1-10 own ids) adds `records`. The service accepts only ids in the reader's heads of the same request (another id is 400 `bad_request`: `get_homebrew_items` is SECURITY DEFINER and answers any id with no owner filter and no `related`). `records` is built from `get_homebrew_items` with one index over the answered records, every one as `linked` (a shared list's composition), so its `craft.from` holds only the keys among that answer; named difference: a client that mirrors every item gets the full `craft.from` by inverting `craft.into` over its copy, or reads `{id}` |
| `GET /me/homebrew-items/{id}` | `api-my-item`: `id`, `key`, `rev`, `updated_at`, `book`, `content` (the editable form), `record`; `ETag`; `record` is built as `GET /api/v1/homebrew-items/{id}` builds it (`get_homebrew_item`, `itemOf`, `withRecords(base, [record, ...related], [])`), so it equals the T0 record |
| `PUT /me/homebrew-items/{id}` | `{ book, content, key? }`: `content` is a `homebrew-v2` item's content (catalog field names), checked by `lib/homebrew.ts` as the editor checks it, then by the database; `key` optional on create (made by the service as `lib/homebrew.ts` makes it), ignored on replace; `art` is never written (the update omits it, as `updateItem` does when `patch.art` is undefined), so a replace keeps the stored picture; `If-None-Match: *` creates (201; an equal row 200; another row 412; a duplicate key 409 `conflict`; an id of another account, where the upsert inserts nothing and the read-back sees no row, 409 `conflict`), `If-Match` replaces by `homebrewUpdate`'s rule (412 with the current `ETag`, gone 404, already applied 200); neither 428; body cap 32768 B |
| `DELETE /me/homebrew-items/{id}` | `If-Match` required; 204; gone 204; moved 412; the delete also removes the item from every list that links it, other accounts' lists included (they get a notice), and deletes its picture |
| `GET /.well-known/oauth-protected-resource/api/v1/me` and `.../mcp/me` | RFC 9728: `resource`, `authorization_servers: ["<SUPABASE_URL>/auth/v1"]`, `bearer_methods_supported: ["header"]`, `resource_documentation`; CORS `*`; `public, max-age=3600` |

- Token: the worker decodes the payload without a signature check
  (PostgREST verifies it) and refuses before any read: none, 401
  `unauthorized` with `WWW-Authenticate: Bearer
  resource_metadata="<site>.well-known/oauth-protected-resource/api/v1/me"`;
  not a JWT, another `iss` or a past `exp`, the same with
  `error="invalid_token"`; no `client_id`, 403 `forbidden` (the app's own
  session token is refused). It forwards the token with the publishable
  `apikey`; a PostgREST 401 is 401 `invalid_token`, the guard's 42501 is
  403. It never logs, caches by or echoes the token; refresh is the
  client's. `aud` is not checked (D7).
- The service: `/me` operations take `op(input, ctx)` with `ctx.token`;
  `rpc` and a PostgREST table helper take the token; T0 operations stay
  as B1 wrote them.
- CORS on `/me`: `ME_ORIGINS` in `rest.mjs`, empty at B5b. A listed
  `Origin` is echoed with `Vary: Origin`, methods `GET, POST, PUT, PATCH,
  DELETE, OPTIONS`, headers `Authorization, Content-Type, If-Match,
  If-None-Match`, `Access-Control-Expose-Headers: ETag,
  WWW-Authenticate`, `Max-Age` 86400, no credentials; any other gets no
  `Access-Control-*` header. Reason (placed, plan-B1-2-N5): a bearer token
  is not ambient, so cross-site request forgery is not it; a browser
  client keeps a token that reads, changes and deletes a whole account
  in page script, where any script on that page can take it, and a public
  client also holds a refresh token. The allowlist makes each browser
  client a reviewed decision (one deploy and a `CONTRACTS.md` line); the
  known clients are servers (Charkeeper, the vendors' connectors) and
  need no CORS. Answers: `Cache-Control: private, no-store`, `nosniff`,
  the CSP `sandbox`.
- `/mcp/me`: B2's dispatcher listing every `x-mcp-tool` operation; a
  request without a valid client token is HTTP 401 with the
  `WWW-Authenticate` above (`.../mcp/me`); the `Origin` 403 holds. Tools
  `list_my_lists`, `create_list`, `get_my_list`, `update_list`,
  `delete_list`, `add_to_list`, `update_list_entry`, `remove_from_list`,
  `list_my_homebrew_items`, `get_my_homebrew_item`, `save_homebrew_item`,
  `delete_homebrew_item`; an omitted `id` is made by the adapter and
  returned; `destructiveHint` on deletes; the descriptions of
  `delete_list` and `delete_homebrew_item` name the cascades of their
  `DELETE` rows; descriptions mark notes and homebrew text as data.
- `openapi.json`: `components.securitySchemes.supabaseOAuth` (`oauth2`,
  `authorizationCode`, the production URLs, `scopes: {}`, "discover them
  from the protected-resource metadata"), `security` on each `/me`
  operation, the new error codes (section 5.1), the sync fair use and
  what an account `rev` covers (section 3.4). Also: `_routes.json` adds
  `/.well-known/oauth-protected-resource/*`; fixtures
  `docs/fixtures/api/v1/me-*.json` and `docs/fixtures/mcp/me-*.json`;
  `tests/contracts.js`; `CONTRACTS.md` section 6; `llms.txt` (how to
  connect; the sync rule); the law sentence of section 3.6 in
  `CLAUDE.md` and its copies; `check-site` (`/api/v1/me/lists` 401 with
  `WWW-Authenticate`, both metadata documents 200).
- Tests (stubs): every row above; each 401 and 403 case; 409, 412, 428;
  a repeated create, a repeated update after a lost answer and a
  repeated delete converge; 11 ids is 400, and an id outside the
  reader's heads is 400; a list `PATCH` with a stale `If-Match` is 412;
  a create with a duplicate key or another account's id is 409; a `PUT`
  replace keeps `art`; a list past 65536 B is 422;
  a listed `Origin` echoed with `Vary`, another without headers;
  `/mcp/me` `initialize` without a token is 401; `/mcp` lists no account
  tool; no answer or error holds the token.
- Owner steps after the closeout squash: the production switch (B5a step
  8); the `/mcp/me` connector in Claude with sign-in; a client for
  Charkeeper only when its author asks.
- Placed lines (planner, 2026-11-12; each is its own acceptance line of
  B5b and the closeout): (1) the export flow ("Скачать JSON", "Скачать
  мои данные") gets one link "Читать эти данные через ИИ-ассистента или
  API" / "Read this data through an AI assistant or the API" to the user
  page (owner note 7, default: in B5, when account reads exist); (2) the
  user page and the developer page name the account reads and how to
  revoke a connection; (3) the file-check cap rises to 65536 B only if
  landing 3's 32 KB reading is at most 3 ms p99, else it stays 32768 B
  and the closeout says so; (4) the follow-up on issue 72 is posted and
  the issue closed once the account-level read is live
  (`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`, A2);
  (5) print via an assistant (owner idea, 2026-11-12,
  `C:\Users\Ignat\.dhloot\notes\57\afk-decisions-57-debt-2026-11-10.md`):
  no print endpoint and no PDF tool in the API or MCP (the fit is
  measured in a browser, the worker stores nothing, a print set is
  account data); instead a write tool `create_print_set` (MCP) and `POST
  /api/v1/me/print-sets` make a print set in the reader's account from
  record ids and counts and return the app link `<site>p/<id>`, where the
  reader prints. Checked against B5a: Q9 and D7 leave `print_sets` out of
  the client scope, and B5a's acceptance probes that a client token is
  refused there; so the tool needs, inside B5a, `print_sets` in the
  guard's allowed list (step 2) instead of a `print_sets_no_client`
  policy, the print set in the consent's scope sentence and both privacy
  pages, and that probe turned into an allowed-write probe; B5a's stop
  rule is unchanged. The B5 planner refresh before B5a decides it
  (default (owner AFK): add it, because the owner asked); if it waits,
  section 10 records it.

Standing checks: 1. Scale: no screen. Heads at the limits: lists 50 (150
at 3x), items 100 (300, about 33 KB), entries 100 a list (300); `?ids=`
at most 10; an add at most 100 entries; a list at 3x with long notes can
pass 65536 B and answers 422 with the app link, as a shared list. 2.
Errors: a failed write is 503 and the retry converges (a create by its
id; an update by the row read again, never a copy held from before; a
delete by 204); a conflict is 412 with the current `ETag`, and the client
reads the row again; a deleted list or item is 404 on a read and 204 on
a delete; the app's open tab gets the broadcast that the API's write
fires, as from another tab (`STATE.md`, the two-tab merge); a stale
client meets only added fields; a revert of B5b answers `/me` with the
JSON 404 again and keeps every row. Possible loss: a connected app's
delete is permanent (no undo), hence `If-Match`, `destructiveHint` and
the consent sentence; a list delete also deletes its share links, the
players' requests and its notices; an item delete also removes it from
every list that links it, other accounts' lists included (they get a
notice), and deletes its picture; a client token can clear an item's
picture at PostgREST (`PATCH` on `homebrew_items` with `art` null).
These are the app's own delete semantics; no copy is kept, and the
reader's only recovery is a lists file or a homebrew file saved before
(`FEATURES.md`, "Exports"). Remaining loss by last writer wins: an entry
`PATCH`, and a list `PATCH` without `If-Match`, can write a field from a
copy the client held from before another write; a list `PATCH` with
`If-Match` answers 412 instead. A plan-review trigger (Status). 3. Consistency:
the app's own semantics (limits, ids, keys, last writer wins, the
read-back rule); resource names as the app's tabs. 4. RU/EN parity:
records are pairs; error messages and `openapi.json` are English.

Gate cost about 25 min (`check:fast`, CI). Review: required (a public
contract; the write protocol).

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
- Q9, the writes in v1: lists (create, rename and notes, delete) and
  their entries (add, change, remove), homebrew items (create, replace,
  delete). Not chosen: sources, cards, pictures, share links, purchase
  requests (more surface before a consumer asks; section 10). Accepted:
  an assistant cannot make a homebrew source or a picture.
- Q10, the token: only a connected app's token (with `client_id`); the
  app's own session token is refused with 403. Not chosen: accepting
  both (a pasted session token carries sign-in and deletion past the
  guard). Accepted: a script needs the consent flow.
- Q11, browser clients on `/me`: the allowlist is empty at B5b. Not
  chosen: `*` (any page that holds a token reads the account, section 6,
  B5b, "CORS"). Accepted: the first browser client waits for a deploy.
- From `reviews/plan-B5a.md` (default taken (owner AFK), the report's
  recommended option): R1, the guard refuses a client token whose
  session ended (`api_client_session_live()`, B5a step 2); not chosen:
  stating an up-to-an-hour window after "Disconnect"; accepted: one more
  definer function. R7, an optional `If-Match` on `PATCH /me/lists/{id}`;
  not chosen: last writer wins only; accepted: one more guard row. N10,
  `?ids=` builds `records` from one index over the answer and names the
  `craft.from` difference; not chosen: one `get_homebrew_item` per id
  (up to 10 RPCs and their CPU); accepted: a mirror inverts `craft.into`.

Defaults taken (owner AFK), 2026-11-12, each the planner's recommended
option; the owner may reverse any before its batch:

- Landings (D8): B2a lands alone as landing 2; B3 and B2b land together
  as landing 3. Not chosen: everything at the closeout (the CPU defect
  stays live; no reading for B3). Accepted: two more merge-back commits
  (about 23 min each).
- The CPU fix: one record per line in the chunk files plus an isolate
  cache of the roll section's index. Not chosen: precomputed per-total
  `std` files (60 files of the 98 left at 3x; kept as the fallback); a
  second, lean record file set (54 more files today, about 156 at 3x:
  past the file margin); caching the parsed roll tables only (it leaves
  the four 64 KB chunk parses, the larger cost, on every request).
  Accepted: the chunk layout is one record per line from now on.
- Search (D10): names in both languages and the facet columns only. Not
  chosen: descriptions and stat lines (CPU at 3x). Accepted: `q` finds
  fewer records than `#/search`, which also reads descriptions.
- The file-check cap: 32768 B at ship, raised to 65536 B at the closeout
  only after a reading. Not chosen: 262144 B (the outline's figure) or
  65536 B at ship (a cap may never fall). Accepted: a longer file is
  checked in the app's import.
- The lists import panel takes the My items panel's file row with the
  two links (B2b). Not chosen: the inline links of today's hint.
  Accepted: the lists panel's hint changes shape. The export-flow link
  waits for B5 (owner note 7's default).
- Legacy MCP clients of `2025-03-26` are served with the `2025-06-18`
  shapes (the settled list named `2025-06-18` and `2025-11-25`). Not
  chosen: refusing them (an older connector would fail). Accepted: one
  more version in the supported list, which may not shrink later without
  breaking a client.

Defaults taken (owner AFK), B3 pass, 2026-11-12, each the planner's
recommended option; the owner may reverse any before B3's commit:

- The search projection: build-time folded names in text shards with
  facet codes, scanned with `indexOf` from the most selective term (D10).
  Not chosen: per-request folding or line splits (past 10 ms at 3x,
  plan-B2a-4); per-facet id lists (a second access path for the same
  answer); two file sets for folded and display names (more reads, the
  same bytes). Accepted: about 620 KB of text decoded once per isolate
  and cache period at 3x.
- Broad queries: 400 `too_broad` past 300 kept lines or 3000 anchor
  positions. Not chosen: a minimum word length (refuses `яд`); an unranked
  answer (an order that is not `#/search`'s). Accepted: a fragment such
  as `ка` is refused, and a cap may rise later but never fall.
- The search format is `daggerheart-loot/api-search`: `api-records` is
  already the internal `apidata/records/index.json` format. A row is
  record v1 cut to `id`, `name`, `kind`, `source`, `table`, `tier`,
  `rarity`, `link`. Not chosen: `source` as a bare id (two shapes for one
  field name).
- File-check lines name a lists entry by item id only (plan-B2a-5,
  default (a)). Not chosen: a lean id-to-name projection (a new read).
  Accepted: an assistant reads a name with `get_record`.
- The file-check answer: one `lines` array with a `list` index and a
  `text` pair, a `message` pair for a refusal, `unknown_format` as the two
  panels' texts joined. Not chosen: a nested per-list report (a second
  shape for the same lines).
- `check_file` takes `file` as a string. Not chosen: an object, or both
  (the byte cap is on the text; a union type may not pass every client's
  tool schema check, not verified). Accepted: an assistant escapes the
  JSON once.
- `q` takes at most 8 terms (new), beside 200 characters.

Owner stop, not a question: B5a step 1 (a client token that changes the
email or the password, links or unlinks an identity, or enrolls a factor
stops B5; a global logout and a `data` change are recorded, not a stop).
The owner's review of the audit table is an owner step (B0 step 11).

## 8. Announcement for issue 72 and the second consumer

The texts live in the owner note
`C:\Users\Ignat\.dhloot\notes\57\ai-mcp-closeout-posts.md`: A (the issue 72
comment after B1 is live; the issue stays open), A2 (the follow-up and the
close once the account-level read is live: a placed line of B5b) and B (the
bacchus-atlas migration issue). The orchestrator posts them as that note
says; no batch and no gate waits on an answer. The text that this section
held until 2026-11-12 (the plan-B1 draft and the bacchus-atlas field
mapping) is in `git show 93eac0ae:issues/ai-mcp/plan.md`, section 8; the
bacchus-atlas facts are in `context.md`, "Second consumer". A mirror
stores the record's `link` and `image` URLs as given; since B2a a `link`
carries `?v` (D9).

## 9. Risks, assumptions, dependencies

- CPU on the deployed worker (measured 2026-11-12, Pages Metrics; the
  axis label says ms, the values read as microseconds): a `std` roll p50
  about 7.5 ms and p99 about 17.5 ms, a record read 2-3 ms, no error and
  no exceeded-CPU count in 95 requests. B2a cuts the `std` roll's parse
  from about 290 KB to about 38 KB. The unit is an assumption until a
  reading shows a value that only one unit explains; the landing-2
  readings record it as shown.
- B3's cost model takes a production factor of about 4.2 (B1's `std`
  roll, p50 7.5 ms against 1.78 ms here) from local medians: a search at
  3x costs about 1.8 ms here cold, so about 7.6 ms there; B3 step 1 stops
  above a factor of 5.5, and step 14 reads the real cost. The worker
  bundle grows with the parsers, the validators and the two stemmers
  (B3 step 13 records the gzip size against the free plan's 3 MB,
  documentation, not verified).
- MCP clients in the cloud may send an `Origin` header; `/mcp` answers
  403 to any `Origin`, so the owner's connector test after landing 2 is
  the proof, and the fallback is a client-origin allowlist (B2a outcome).
- The clients' connection steps (Claude, ChatGPT, Cursor, Claude Code)
  change often; B2b checks them on the day against each official page
  and links those pages from the user page, so a later change sends the
  reader to the client's own text.
- The MCP spec facts of `context.md` were read on 2026-11-12 from the
  `2026-07-28` pages; a client that speaks only `2026-07-28` and sends no
  `MCP-Protocol-Version` header gets 400 `HeaderMismatch`, as the spec
  requires.
- `env.ASSETS` reads are assumed to cost no subrequest and no Functions
  request (true for `names.json` today, by the documentation).
- CORS brings browser traffic onto the shared quota; preflights count, and
  `Max-Age` 86400 (2 h on Chromium) limits them. The guard stays the
  fair-use text; a burn has the same effect as from a server.
- Charkeeper's import contracts change fast; the internal field check of
  section 5.3 is dated (contracts at `38ed87d`), and nothing in the
  repository depends on it after B1.
- `get_shared_list`'s answer at the import limits can pass 24 MB (measured
  2026-10-22); the 65536 cap refuses such a list (accepted in section 6,
  B1, scale).
- The `rights` values come from B0's per-record audit (Q6 = C); the SRD
  2.0 PDF's two-column layout makes a text search miss names, so the
  audit matches text and stats and the owner reviews the table. A later
  correction is a value change in `docs/rights/records.json`, not a
  schema change.
- Q7 = A accepts that DPCGL 1.9 names no website or API among the
  Permitted Formats; the takedown promise is the remedy if Darrington
  Press reads it otherwise.
- The DPCGL 2.0 can change (clause 11.1); D5 names the version and date
  it read.
- B5: the Supabase OAuth server is BETA; the guard's RPC half relies on
  PostgREST's pre-request setting, which a restore drops and the hosted
  project may refuse or ignore (the probe of B5a's acceptance, step 8's
  restore step, the named fallback of step 2); whether a client token
  can change the email or the password, link or unlink an identity, or
  enroll a factor on Auth is unmeasured (B5a step 1 stop rule); the
  token's personal claims are unmeasured (step 1); Supabase does not
  bind `aud` to the resource (D7 accepts it); a quota burn also stops
  account sync until 00:00 UTC.

## 10. Deferred

- A lean share-list projection RPC if the 422 path is hit in practice (a
  migration and a definer: plan review).
- API keys, per-client quotas, cursors, sort and field parameters, batch
  reads, clipboard text, prices, `Access-Control-Expose-Headers` and more
  `Access-Control-Allow-Headers` (for example `If-None-Match`): until a
  consumer asks. Export formats and published mappings are not deferred;
  owner Q1 rules them out.
- Account tier, until a consumer asks (owner defaults Q8-Q11): a
  read-only grant per client, writes of sources, cards and pictures,
  share links and purchase requests through the API, a browser client on
  the `/me` allowlist, webhooks or a push channel for sync.
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
- Pages CORS on `/apidata/*` (plan review Risk 7): B1's probe records the
  header. With CORS on `/api/v1/` (owner, 2026-11-10), a browser client has
  the frozen API and no reason to bind to `apidata/`, which `CONTRACTS.md`
  section 5 calls internal and changed without notice. Recommended: accept
  whatever header Pages sends and add no `_headers` rule.

## 11. Publication and the v1 freeze

The owner posts the announcement and publishes as soon as B1 ships, then
iterates on the contract. v1 is frozen at that moment (D3), so these must
be right before B1's squash:

- The paths, the path parameters and the reserved prefixes (`/api/v1/me/`
  for B5b, `/mcp` for B2 with `/mcp/me` for B5b,
  `/.well-known/oauth-protected-resource/` for B5b).
- The bulk catalog: the URL `/api/v1/catalog/index.json`, the
  `api-catalog` and `api-catalog-chunk` schemas, the `rev` rule (an
  opaque string compared for equality only; it changes whenever its
  record's JSON changes and may change at other times), absolute chunk
  URLs; not frozen: chunk
  names, count and grouping (section 5.4). With it the sync rule of
  section 3.4 (heads of `{ id, rev }`, a dropped id is a delete), which
  B5b's account heads follow.
- `Access-Control-Allow-Origin: *` on the catalog files and on the
  catalog image URLs under `<site>img/` and `<site>og/` (a canvas client
  needs it, section 8; a homebrew `site.art` URL is Supabase's and
  outside the promise); the URLs are values a client stores, not a path
  form it builds.
- T0 answers never depend on the caller: `Authorization` is ignored on
  every T0 path.
- Every parameter name and value list: `dice`, `total`, `sources`,
  `kinds`, `rarity`, `hope`, `fear`, `part`, `value`; which are required
  (`part` on the `eq_*` tables and the `part` sections).
- Each answer's `format` id and `version`, and every field name, type and
  value list of each answer format (plan-B1-2-R4): `api-rolls`,
  `api-roll`, `api-tables`, `api-table`, `record`, `api-shared-list` and
  `api-error`. The value lists include the roll `mode` (`std`, `alt`,
  `table`, `part`), the dice `kind` (`nd12`, `typed`, `duality`, `pick`),
  `col`, the record `origin`, `kind` and `key` (the value relation fields
  hold), `rarity`, `tier`, the stats
  enums, the shared-list audience, and `rights.license` with its
  vocabulary `dpcgl` and `owner` (the values per record come from B0's
  audit table).
- The error envelope, the `code` values and the status of each case (400,
  404, 405, 413, 415, 422, 503; the list widens in place with new cases,
  and a client acts on the status of a code it does not know, section
  5.1), and the caps that a client can meet
  (65536 B on a shared list and a homebrew item, 4096 B on a roll body):
  a cap may rise later, never fall.
- The link forms (`<site>i/<id>`, `<site>i/en/<id>`, `<site>h/<uuid>`);
  since B2a a link may carry an opaque `?v` query (D9), which a client
  stores with the URL and never parses.
- From B2a (landing 2): the MCP endpoint URL `<site>mcp`, the tool names
  (`list_rolls`, `roll`, `list_tables`, `get_table`, `get_record`,
  `get_homebrew_item`, `get_shared_list`; B3 adds `search_catalog` and
  `check_file`), each tool's argument names (the REST parameter and body
  field names), the result as the REST answer's JSON, `isError` for an
  operation error, no sign-in on `/mcp`, and the supported protocol
  versions (a version may be added, never removed while a client uses
  it), and the 65536 B body cap (it may rise, never fall). From B3:
  `api-search` and `api-file-check` v1 with every field and value list
  (the file check's `reason` values, `list`, `counts`), the `q`, `kind`,
  `source`, `table`, `tier`, `rarity`, `limit` and `filter` parameters,
  the `check_file` argument `file` (a string), the code `too_broad`, and
  the caps (`q` 200 characters and 8 terms, `limit` 50, `filter` 512
  characters, 300 kept lines and 3000 anchor positions, a file check
  32768 B; each may rise, never fall).
- The CORS rule: `*` without credentials on the public paths, the methods
  and headers of the preflight. Not frozen: the `/api/v1/me/` answers,
  which carry `*` in v1 only because the path is reserved and holds no
  data; B5b replaces both its 404 and its preflight (plan-B1-2-R3).
  Removing CORS or narrowing it to an allowlist later breaks every
  browser client.
- The host: `daggerheart-loot.pages.dev`; a custom domain comes beside
  it, never instead (section 3.7).
- The legal text: B0 committed and the audit table's `reviewed` date set
  by the owner, because the first consumers copy the `rights` values and
  the notice. If the squash comes first, `licenseOf` answers `owner` for
  every record while `reviewed` is null, so v1 claims too little, never
  too much; the reviewed values follow as a `rights` value change, which
  the list below allows (plan-B1-2-2).

Safe to add later, inside v1 (section 3.4, the 2026-10-21 rule on value
lists): a new resource (`/mcp`, `/api/v1/records` search, file checks,
`/api/v1/me/`, `/mcp/me`, the protected-resource metadata), a new error
`code` for a new case, `securitySchemes` and `security` on the new
operations only, a new optional parameter (`q`, `filter`), a new field (for
example a translation credit in `rights`), a widened value list (a new
source id, a new roll section), `Access-Control-Expose-Headers`, more
allowed request headers, a higher cap, a longer `Max-Age`, a changed
`Cache-Control` time, the fair-use text, the `rights` value of a record
after an audit. Anything else is `/api/v2/` beside v1.
