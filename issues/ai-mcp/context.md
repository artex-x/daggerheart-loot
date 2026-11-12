# Shared task context - TASK ai-mcp

Orchestrator (or first worker) maintains this file so later steps do not re-fetch the same sources.

## Goal
- A remote MCP endpoint for AI assistants: the follow-up of the task
  `ai-integration`, which shipped the static surface (`catalog-index.csv`,
  the `llms.txt` reading route, the `Content-Signal` line). Plan it after
  `cloudflare-pages`, which follows R10 (owner, 2026-10-22), on the final
  host.
- The choice and the options not chosen: `docs/decisions/`, "AI assistants
  read a compact index and the record pages". The inputs below come from
  the `ai-integration` plan and context (owner, interactive, 2026-10-15).

## GitHub issue (if any)
- URL: none (local task id).
- Captured or last verified: 2026-10-15, at the `ai-integration` closeout.
- Decisions already settled (owner, interactive, 2026-10-15):
  - Q1 = A: the static surface first; this endpoint after `cloudflare-pages`.
  - Q2 = C: the endpoint reads the catalog, tables, file checks, shared
    links and homebrew signed out, and the reader's own account through
    Supabase OAuth, read and write.
  - Q3 = A: the route `/mcp` of the Pages project `daggerheart-loot`; the
    product-law sentence changes in this task.
- Decisions already settled (owner, chat, 2026-11-10; plan `Q2` and the
  plan review's Risk 6):
  - Plan Q2 = A: the API serves every source `data.json` publishes, each
    record with `source`, `link` and a `rights` field (record v1), and
    `openapi.json` carries the DPCGL notice. Home: D3 under
    `docs/decisions/` and `docs/specs/CONTRACTS.md` section 6 (not an
    "Owner insights" rule, `.claude/README.md`); written in B1.
  - Risk 6: one sentence in both privacy pages says that shared lists and
    homebrew items are readable by programs through the public API. Home:
    `pages/src/privacy.html` and `pages/src/en/privacy.html`, "Link
    previews" (not an "Owner insights" rule); written in B1.
- Decisions already settled (owner, interactive, 2026-11-10):
  - Issue 72 (replaces the plan's Q3): nothing is posted on issue 72 until
    the API is live; then the owner posts the announcement (`plan.md`
    section 8: working URLs, no mapping offer, no CORS question) and tells
    the Charkeeper author. No batch and no gate depends on the author's
    answers.
  - CORS: `/api/v1/*` answers `Access-Control-Allow-Origin: *` with no
    credentials, `Access-Control-Allow-Methods: GET, POST, OPTIONS`,
    `Access-Control-Allow-Headers: Content-Type`,
    `Access-Control-Max-Age: 86400`, and `OPTIONS` answers 204. `/mcp`
    keeps no CORS headers and answers 403 to a browser `Origin`. The B5
    `/me` paths take an explicit allowlist, not `*`. Home: D3 and
    `CONTRACTS.md` section 6; written in B1.
  - Publication: the owner publishes as soon as B1 ships, then iterates on
    the contract (`plan.md` section 11 lists what v1 freezes).
  - The app stays independent of the API (`plan.md` section 3.8). Home:
    D2; written in B1.
  - Q6 = C: a per-record audit against the SRD 2.0 decides each record's
    `rights.license`, stored in the build-time table
    `docs/rights/records.json` with a test; the owner reviews the table
    before B1's squash. Home: D5 and that table; written in B0.
  - Q7 = A: the API serves the Russian text on the same reading as the site
    and `data.json`; the takedown promise covers the API. Home: D5;
    written in B0.
- Open questions: none for the owner in `plan.md` (B5 questions Q8-Q11
  are "default taken (owner AFK)", 2026-11-11). Open design question:
  B5a's screen layout (a mock). B3's search projection and file-check
  line names: settled by the B3 planner pass of 2026-11-12 (`plan.md`
  B3, section 7 "Defaults taken (owner AFK), B3 pass"; measurements in
  "B3 planner measurements (2026-11-12)" below).

## Issue 72 and the layered-architecture question (owner, 2026-11-10)

- Issue 72 (GitHub, fetched 2026-11-10): the Charkeeper author
  (`kortirso/charkeeper`, Ruby, TTRPG character manager,
  https://charkeeper.org) asks for an integration. Flow they propose: the
  user selects external tables in Charkeeper; Charkeeper requests tables and
  options from daggerheart-loot; the user clicks loot; daggerheart-loot
  returns a result item; the user approves; Charkeeper creates the item from
  that data. The owner replied: ai-mcp is planned next, a third-party API can
  also be exposed, and asked what API and capabilities Charkeeper needs. No
  answer from the author yet. The `charkeeper-homebrew-import` skill
  describes Charkeeper's homebrew import JSON (Daggerheart items, weapons,
  armor, consumables).
- Owner request (2026-11-10): plan ai-mcp as a multi-layered architecture:
  a backend (an HTTP API for third parties and the MCP server) with the MCP
  server as a client of that backend, instead of the MCP endpoint reading
  data on its own.
- Owner addition (2026-11-10): the layered design may move logic from the
  frontend to the backend (for example the roll logic) and data from static
  files to the database (for example `data.json`). The owner accepts radical
  changes and leaves the decision to the planner. The planner prices each
  move against the product laws, the offline and static-host paths, the
  RU/EN parity, the frozen contracts and the migration cost, and may
  recommend a staged path.
- Status of the predecessor (stale: see "Planner facts" below):
  `cloudflare-pages` has no commits and no `issues/` directory on 2026-11-10; the Outline above says to plan ai-mcp
  after it. The owner asked to plan now: the plan must say what it assumes
  about the host and what moves if `cloudflare-pages` changes it.
- Tension to resolve in the plan, not here: the Design inputs put the MCP
  route in the stateless preview Worker (Q3 = A) and the product law allows
  one stateless Worker and the Supabase backend as the only server that
  stores data. A shared API layer must fit that law or amend it, with the
  options and the quota (100,000 requests a day per account) priced.

## Design inputs (owner-settled, 2026-10-15)

Where it runs (Q3 = A): the route `/mcp` of the Pages project
`daggerheart-loot`, beside the card families. Options not chosen: a second
Worker in the same account (no quota gain: the quota is per account), a
Worker in a second Cloudflare account (a second account, token and secret
set), a local npm package (desktop and coding clients only, an npm
pipeline), no MCP (no file check and no roll for an assistant).

What it reads (Q2 = C, "everything"):

| Tool group | Answer | Source |
|---|---|---|
| Catalog | search by the index columns and a name query (at most 50 rows); one record with its text, stats, craft, set and site link | the index and a per-record read (a design question of `ai-mcp`) |
| Tables | the roll tables, and a roll on one with the dice shown | `app/src/lib/roll.ts`, `std.ts`, the data |
| File checks | the import's own errors and skips for `import-v1`/`v2`/`v3` and `homebrew-v1`/`v2` | `app/src/lib/bundle.ts` `parseBundle`, `app/src/lib/homebrewFile.ts` `parseHomebrew` |
| Shared links, signed out | a share link's list and a homebrew item by its id, to the link's audience | `get_shared_list`, `get_homebrew_item` as `anon` |
| The reader's account (OAuth) | the reader's lists and homebrew, read and write | the reader's own session against the existing RPCs and RLS |

Protocol: Streamable HTTP, POST, one JSON answer per request, no session
id, no SSE, every other method 405. It answers the `2025-06-18`/`2025-11-25`
shape (`initialize`, `tools/list`, `tools/call`, 202 for a notification)
and the `2026-07-28` shape (`server/discover`, `_meta` versions,
`resultType`, `ttlMs`/`cacheScope`).

What Q2 = C implies for `ai-mcp` (stated to the owner, 2026-10-15):

- An auth design. The authorization server is Supabase Auth's OAuth 2.1
  server (PKCE; Client ID Metadata Documents, or Dynamic Client
  Registration where a client needs it; deprecated in `2026-07-28`). The app
  gains a consent screen and a way to see and revoke a connected
  assistant. The Worker holds no token: it forwards the reader's bearer
  token to PostgREST, so RLS and the definer functions decide, as for the
  app. Free-plan availability of the OAuth server is not verified.
- A product-law change: the one stateless Worker renders link cards and
  answers an MCP endpoint, and for a signed-in reader it relays that
  reader's calls to Supabase; it stores nothing. `CLAUDE.md` "Product
  laws", `META.md` section 3, a decision that amends "Link previews come
  from a stateless worker".
- A privacy policy change (`pages/src/privacy.html` and its English page):
  a reader's lists and homebrew reach the AI vendor the reader connects.
- Write tools: each one names its effect, is idempotent by a client-made id
  where the RPCs allow it, and is limited to what the app's own calls
  allow; an injected prompt (another person's homebrew text or list note,
  read by a signed-out tool) can reach a write tool, so the tool
  descriptions mark that text as data, and a write needs the client's
  confirmation (`destructiveHint` on deletes).
- Plan review triggers: a public contract change, a product-law change, a
  new write protocol, possibly a migration (consent and client rows).

Limits and security (all groups):

- CPU 10 ms: a tool input past 256 KB is refused before parsing; a full
  `data.json` is never parsed in the Worker (the link-previews rejection,
  896 KB against 10 ms, holds); the index parse is measured in `ai-mcp`.
- Quota: each conversation costs about 3 to 30 requests; a deliberate burn
  stops cards and MCP alike until 00:00 UTC (accepted for the cards on
  2026-10-14); `<site>#/...` keeps working.
- `Origin`: a request with a browser `Origin` that is not an allowed client
  answers 403 (DNS rebinding, MCP MUST); no CORS headers. This holds for
  `/mcp` only; `/api/v1/` answers CORS (owner, 2026-11-10).
- No log, no cookie, no stored state; the publishable key for `anon`
  reads.
- Licence: the catalog tools serve what `data.json` already publishes.
- Contract: the endpoint URL, the tool names and their argument and result
  shapes are frozen once a GM configures them; fixtures
  `docs/fixtures/mcp/*.json` and `tests/contracts.js`.

## Outline

Planned after `cloudflare-pages`, from "Design inputs" above. It starts with the auth design and a
measurement:

- Open design questions: a hand-written dispatcher or the SDK
  (`createMcpHandler`); the per-record data source for the record tool;
  the consent screen and revocation in the app; whether the Supabase
  OAuth 2.1 server is on the free plan and fits the clients' registration.
- Files it will touch: `preview/mcp.mjs` (new) routed from
  `preview/worker.mjs` on `POST /mcp`; its tests; `docs/fixtures/mcp/`,
  `tests/contracts.js`, `CONTRACTS.md` section 5, `llms.txt` ("no public
  API" becomes the endpoint and how to add it in Claude and ChatGPT);
  `CLAUDE.md` "Product laws", `META.md` section 3, the privacy pages; the
  account screen for connected assistants; possibly a migration.
- Owner steps: a measurement deploy with `wrangler pages deployment tail`.
- Plan review: required (a public contract change, a product-law change,
  a new write protocol).

## Research (web, 2026-10-15)

- MCP: the current revision is `2026-07-28`. It removes protocol sessions
  and `Mcp-Session-Id`, removes the `initialize` handshake (version and
  capabilities ride in each request's `_meta`), adds `server/discover`
  (MUST), replaces the GET stream with `subscriptions/listen`, removes SSE
  resumability, requires `resultType` on results and `ttlMs`/`cacheScope`
  on list and read results, deprecates Dynamic Client Registration in
  favour of Client ID Metadata Documents. Streamable HTTP: one endpoint,
  POST, the answer is `application/json` or `text/event-stream`, a
  notification answers 202, the server MUST validate `Origin`. Clients still
  speak `2025-06-18`/`2025-11-25` (initialize, optional session id).
  https://modelcontextprotocol.io/specification/latest/changelog,
  https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.md
- Cloudflare: `createMcpHandler()` (package `agents`) serves a stateless
  server from a plain Worker, no Durable Object; `McpAgent` keeps a Durable
  Object per session (one author reports it deprecated after `2026-07-28`;
  not confirmed by Cloudflare). A hand-written read-only server on the free
  plan measured at most 2 ms CPU per call against the 10 ms limit; the free
  plan allows 100,000 requests a day per account, shared by every Worker
  and Pages Function. https://developers.cloudflare.com/agents/api-reference/mcp-handler-api,
  https://developers.cloudflare.com/agents/guides/build-mcp-server,
  https://dev.to/301st/an-mcp-server-on-cloudflares-free-plan-measured-against-the-10-ms-cpu-limit-468b
- Pages Functions advanced mode: `_worker.js` takes every request and must
  forward static paths to `env.ASSETS.fetch`.
  https://developers.cloudflare.com/pages/functions/advanced-mode/
- Claude: custom connectors take a remote MCP URL on Free, Pro, Max, Team
  and Enterprise; Free holds one custom connector; "No sign in" is an
  option; the connection comes from Anthropic's cloud, so the server must
  be public. https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- ChatGPT: developer mode accepts remote MCP servers with OAuth, no auth or
  mixed auth over SSE or streaming HTTP; plan eligibility differs between
  sources (not verified). https://www.speakeasy.com/docs/mcp/build/integrate/clients/using-chatgpt-developer-mode-with-gram
- Supabase Auth can act as an OAuth 2.1 authorization server for MCP
  clients (PKCE, optional dynamic registration); the app builds the consent
  screen; plan availability not verified.
  https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- Crawlers. OpenAI: `GPTBot` (training), `OAI-SearchBot` (search index),
  `ChatGPT-User` (fetches a person asked for; robots rules may not apply).
  https://developers.openai.com/docs/bots. Anthropic: `ClaudeBot`
  (training), `Claude-User` (fetches a person asked for), `Claude-SearchBot`
  (search quality); robots.txt at the top-level directory of each host.
  https://support.claude.com/en/articles/8896518. Google: `Google-Extended`
  is a robots token, no crawler of its own, for Gemini training and
  grounding; no effect on Search.
  https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- Content signals: `Content-Signal: search=..., ai-input=..., ai-train=...`
  in a robots.txt group (Cloudflare's Content Signals Policy); a crawler
  that does not know the line ignores it (RFC 9309); compliance is the
  crawler's. The IETF `aipref` drafts are not final. The policy's own
  definitions (fetched 2026-10-15): `search`
  is building a search index and giving results (hyperlinks and short
  excerpts), not AI search summaries; `ai-input` is putting content into
  AI models, including retrieval augmented generation, grounding and other
  real-time taking of content for AI search answers; `ai-train` is training
  or fine-tuning. An absent signal neither grants nor restricts. The policy
  does not say how a signal in the `*` group relates to a named group; by
  RFC 9309 a crawler obeys the group that names its token, so the named
  `Disallow: /` blocks win for those tokens.
  https://blog.cloudflare.com/content-signals-policy/,
  https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- llms.txt: an H1 is the only required part; then a blockquote, free
  sections, H2 link lists and an "Optional" list; a file at a subpath
  covers that path; companion Markdown pages at `<page>.md` are a
  convention, not a requirement. https://llmstxt.org/

## License sources (fetched 2026-11-10)

- DPCGL 2.0 PDF (header "Last Updated 8/05/2026"; the license page dates
  it 25 August 2026):
  https://darringtonpress.com/wp-content/uploads/2026/08/DPCGL_2.0_AUG_26_2026.pdf.
  1.1 DRP Games include Hope & Fear; 1.6 SRD 2.0 is Public Game Content,
  SRD 1.0 stays for legacy content; 1.5(c) the exact text of Campaign
  Frames is Prohibited Content; 1.7 translations are Adaptive Content;
  1.9 Permitted Formats name no website or API; 1.9.1 VTT whitelist;
  1.9.3 frames for actual play only; 4.1 the notice in shared material;
  the combined Daggerheart notice equals `README.md`'s quote.
- SRD page https://www.daggerheart.com/srd/: SRD 2.0 only, 25 August 2026,
  `DH_SRD_2_2026_08_25.pdf`; adds Hope & Fear loot and equipment and "all
  campaign frame mechanics". A text search of the PDF finds some frame
  weapons (Cleaver, Sharpened Rake, Revolver, Shotgun, Holy Shotgun), not
  `Hotspot` or the "Enchanted" items; the layout splits names, so a miss
  is not proof.
- Repository copies: `LICENSE` says SRD 1.0 and lists Hope & Fear outside;
  `README.md`, `README.ru.md`, `llms.txt`, the footer and the terms pages
  say SRD 2.0 with Hope & Fear covered; no copy names the campaign frames;
  `tests/derived.js` never reads `LICENSE` or the terms pages.

## Reasons already disproved

- "The training-crawler block in `robots.txt` protects the item text":
  disproved for the site host (the file is at a subpath, 404 at the root);
  true for the preview host only.
- "A per-record Markdown page is needed for an agent to read one record":
  the stubs `i/<id>.html` already hold the full text and lines.
- "A separate Worker isolates the quota": the 100,000 requests a day are per
  account, shared by every Worker and Pages Function.

## Constraints
- Product law (`CLAUDE.md`, `META.md` section 3): "The Supabase backend is
  the only server that stores data; one stateless preview Worker renders
  link cards and stores nothing." This task changes the sentence (Q3 = A).
- `noindex` stays and crawling stays allowed (`META.md` sections 1-2).

## Planner facts and owner clarifications (2026-11-10)

- Correction: `cloudflare-pages` shipped as `d0fd98bc` (2026-10-28), then
  `path-urls` as `1ace55e7`; the site's host is `daggerheart-loot.pages.dev`,
  `/mcp` is reserved and answers 404 (`CONTRACTS.md` section 5,
  `tools/check-site.lib.mjs`). The "no commits" line above is stale.
- Owner (2026-11-10, via the orchestrator): "what moves to the backend" is
  every app function an API client would otherwise re-implement (search,
  filters, sorting, tables, file checks, share-link resolution), each priced
  as needed or desirable, one or two implementations.
- Owner (2026-11-10): the API is a general platform (other VTTs, character
  managers, Discord bots, GM tools, scripts, AI assistants); Charkeeper is
  the first worked example the contract must satisfy. Resource-oriented,
  versioned, auth tiers, rate limits, formats, caching, OpenAPI as the one
  source for the MCP tools, and no extension point before a second consumer.
- Measured 2026-11-10 (Node 24, this host, `data.js` 1,103,443 B as JSON):
  largest full table `voa` 167,888 B (parse 1.2 ms), its lean rows (id,
  roll, names, kind) 15,315 B; `eq` 186,019 B; `refs` 29,249 B.
- Measured 2026-11-10 through `buildIndex` (plan-review fix pass):
  `eq_weapon` 512 rows (tier 3 the largest part, 145 rows, 21,511 B lean),
  lean rows 74,986 B without `eq` and 144,444 B with it; `eq_secondary`
  148, `eq_armor` 118; `dv` 145 rows, 20,816 B lean; roll pools `arazo` 27
  of 78 rows, `ph` 45 of 93, `frames` 52 of 94; `refs` and `sets` 29,854 B;
  45 records carry both `tier` and `eq.tier`.

## Owner answers, interactive (2026-11-10)

- Q1: the API serves the neutral record and the contract only. No mapping
  table is published, and no `format=` parameter: every consumer maps as it
  wants. (Home: `docs/decisions/`, in the B1 decision D3, the contract
  decision; D1 is the architecture.)
- Q3: superseded by "Issue 72" under "Decisions already settled" above.
- Q4 = B5 of this task, with the free-plan check done by the orchestrator.
- Q5 = yes: the shared 100,000 requests a day, no API keys, no per-client
  limit in v1.
- Verified 2026-11-10 (docs and the owner's dashboard, read only; nothing
  toggled): the Supabase OAuth 2.1 server has no separate charge and
  counts users toward the MAU quota; the project `daggerheart-loot-test`
  (org on the Free plan, 2,666 of 50,000 MAU) shows Authentication, "OAuth
  Server" (BETA) with the enable switch off and available. Dynamic client
  registration is documented for MCP clients. B5's free-plan precondition
  holds; B5 still measures the flow on the test project.

## B5 design facts (2026-11-11)

- Supabase OAuth 2.1 server (docs fetched 2026-11-11,
  https://supabase.com/docs/guides/auth/oauth-server/token-security and
  `.../oauth-flows`): the access token is a normal JWT, `role` and `aud`
  `authenticated`, plus `client_id` (and `session_id`); no custom scopes
  (`openid`, `email`, `profile`, `phone` control OIDC data, not database
  access); "your existing RLS policies continue to work"; restrict a
  client by `auth.jwt() ->> 'client_id'`. `expires_in` default 3600;
  refresh tokens may rotate. Endpoints
  `<ref>.supabase.co/auth/v1/oauth/authorize`, `.../oauth/token`,
  discovery `.../auth/v1/.well-known/oauth-authorization-server`.
  `revokeGrant` ends that client's sessions and refresh tokens at once;
  no revocation endpoint is documented.
- auth-js 2.117.1 (the repository's pin) has `auth.oauth`:
  `getAuthorizationDetails`, `approveAuthorization`,
  `denyAuthorization` (`skipBrowserRedirect`), `listGrants`,
  `revokeGrant`.
- Account writes that exist (migrations at `8f194abd`, `ports/supabase.ts`):
  lists by `apply_list_writes` (invoker, at most 200 ops; `create`/`add`
  `on conflict (id) do nothing`; field updates without a revision check)
  and direct `lists` deletes; homebrew books, items and cards by direct
  table writes under RLS (create `upsert ignoreDuplicates` with a client
  uuid; update `eq('revision', r)` with the read-back rule of
  `homebrewUpdate`; delete by id), `import_homebrew`,
  `move_homebrew_items`, `delete_homebrew_items`; plus shares, purchase
  requests, print sets, `user_prefs`, art uploads (Storage),
  `delete_account`, `delete_account_requests`. Every one of them is
  reachable by any `authenticated` token, so by a client token too.
- Rows carry `revision` (bigint, +1 per edit) and `updated_at`; deletes
  leave no tombstone; the app re-reads by `id,revision` heads.
  `get_homebrew_item` answers `hid`, `mine`, an md5 `revision`, `item`,
  `related`, `updated_at`, never `owner_id`. Limits: `lists_per_owner`
  50, `entries_per_list` 100, `homebrew_items_per_owner` 100.
- Planner defaults taken (owner AFK), `plan.md` section 7: Q8 one grant
  level; Q9 writes of lists, entries and homebrew items only; Q10 client
  tokens only; Q11 an empty `/me` allowlist. B5 split into B5a and B5b.
- Plan review `reviews/plan-B5a.md` (2026-11-11), facts read from the
  repository: PostgREST resource embedding reads other tables through
  foreign keys under RLS on an allowed path (`lists?select=*,list_shares(*)`),
  so path checks alone do not bound a client token; `list_notices` is
  written only by SECURITY DEFINER functions. `supabase/config.toml` has
  `enable_manual_linking = true` and TOTP `enroll_enabled = true`, and no
  OAuth server section. Cascades: a list delete deletes its
  `list_shares`, `purchase_requests` (and lines) and `list_notices`; an
  item delete deletes every `list_entries` row that links it, other
  accounts' lists too, and releases its picture; `PATCH` of
  `homebrew_items.art` to null deletes the picture. The nightly backup
  leaves out roles, so a restore drops `pgrst.db_pre_request`.
  `lists` grants `update` to `authenticated`. `get_homebrew_items` is
  SECURITY DEFINER, answers any id, has no owner filter and no `related`.
- Unverified (the reviewer's reading; B5a step 1 measures): a Supabase
  access token carries `email`, `phone`, `app_metadata`, `user_metadata`
  whatever OIDC scope is asked; PostgREST checks a JWT by signature only,
  so an issued access token stays valid until `exp` after `revokeGrant`.
- B5a step 1 measurement list: token claims; `resource` and `aud`; a
  revoked token at PostgREST; on Auth with the client token: `PUT
  /auth/v1/user` (email, password, `data`), `GET
  /auth/v1/user/identities/authorize`, `DELETE
  /auth/v1/user/identities/{id}`, `POST /auth/v1/factors`, `POST
  /auth/v1/logout?scope=global`, `GET /auth/v1/user`; the discovery URLs
  `<SUPABASE_URL>/.well-known/oauth-authorization-server/auth/v1` and
  `<SUPABASE_URL>/auth/v1/.well-known/oauth-authorization-server`;
  whether the pinned CLI's `config.toml` has an OAuth server section;
  whether the local stack serves the OAuth server. Stop: email, password,
  identity link or unlink, factor enrollment.
- Defaults taken (owner AFK) from that review, `plan.md` section 7: R1
  (the guard refuses an ended session), R7 (optional `If-Match` on a list
  `PATCH`), N10 (`?ids=` names the `craft.from` difference).

## Second consumer: bacchus-atlas (orchestrator, 2026-11-11)

- `github.com/Machenspieler/bacchus-atlas`: static GitHub Pages site, JS,
  no backend, a Daggerheart environments guide. Nothing is posted there.
- It mirrors 264 catalog items into `data/items.json` (id such as `cc7`,
  `w62`; kind; src `core` 120, `hnf` 120, `wondrous` 19, `dread` 5; roll;
  img; en/ru name and description; optional craft id) from our old
  `data.json`; its Prep picker uses a 240-entry item table by id; it
  builds plant-name aliases itself.
- It links `https://artex-x.github.io/daggerheart-loot/i/{id}.html` and
  loads art from that host's `img/`, drawn on a canvas (`crossOrigin`
  anonymous) for a PNG copy, so image bytes need
  `Access-Control-Allow-Origin: *`. Verified 2026-11-11:
  `daggerheart-loot.pages.dev/img/cc7.webp` sends `*`; `/i/cc7.html`
  answers 308 to `/i/cc7`, also `*`.
- It needs stable ids, RU/EN name and description, kind, src, roll,
  image URL, page link, craft, and a build-time pull refresh (no
  account, no write).

## Owner decisions (2026-11-12)

- Documentation (owner note `C:\Users\Ignat\.dhloot\notes\57\ai-mcp-docs-page.md`):
  a user page "With AI assistants" (`pages/src/ai.html`, `en/ai.html`)
  and a developer page "API" (`developers.html`), two footer links next
  to privacy and terms, links from both READMEs and `llms.txt`; a test
  that every `openapi.json` operation is on the developer page and that
  the user page's MCP URL is the shipped one. `llms.txt` stays the
  AI-facing entry and the import-file spec: a new first "Read this first"
  item (read through MCP or `/api/v1`, never by fetching files; import
  files stay the way to create lists and items), the crawl line reworded
  (it is about crawling, not tool calls). Import panels keep two links,
  "Формат файла" and "ИИ-ассистенты" (revision 7b): the direct
  `llms.txt` link leaves the panels, the hint ends "или файл, собранный
  ИИ-ассистентом" / "or a file an AI assistant built", the validation
  messages keep `llms.txt` as plain text. The export-flow link: default
  B5. Home: plan B2b and B5b; then the pages themselves.
- Record links (via the orchestrator, 2026-11-12): the API record `link`
  carries `?v=<v>` as the app's links do (`linkToRecord`); a record
  outside the card map has no `?v`; the `?v` is opaque; the unversioned
  URL is the canonical `og:url`. v1 being one day old, changing the
  value is acceptable. Home: D9 and `CONTRACTS.md` section 6 (B2a).
- Issue 72 (owner note `ai-mcp-closeout-posts.md`, the owner's final
  line): the orchestrator posts comment A and the bacchus-atlas issue B
  once B1 is live and the live checks pass, with no further confirmation;
  issue 72 stays open until the account-level read ships, then the
  follow-up A2 and the close (placed in B5b).

## Live readings after the B1 deploy (orchestrator, 2026-11-12)

- Production `aeb68c0e`: live checks 1-11 of `ai-mcp-live-checks.md`
  passed (openapi.json ETag `"1.0.0-c0de2047"` and 304, CORS `*`,
  preflight 204, catalog index 54 chunks, rights values, `Authorization`
  ignored, JSON 404s, rolls, image `*`, `apidata/version.json` `*`;
  `link.en` is `/i/en/<id>`, and `/en/i/<id>` answers 301 to it).
- CPU, Cloudflare Pages Metrics, Production: baseline 24 h before: 58
  requests, p50 3,103, p75 6,297, p99 11,294. A mixed read load (33
  requests), last 30 min: p50 2,248, p75 3,900, p99 25,846. A burst of 10
  `std` rolls (3-minute view): p50 up to about 7,500, p99 17,531. 0 errors,
  0 exceeded-CPU in 95 requests. The axis says ms; the values read as
  microseconds: a record read about 2-3 ms, a `std` roll about 7-17 ms.
- Method (for the next readings): a controlled burst with `curl`, wait,
  Metrics tab of `/pages/view/daggerheart-loot`, Production, a 3-minute
  range for a burst, read requests, errors and the CPU percentiles.

## MCP spec facts (read 2026-11-12, revision 2026-07-28)

- Sources: https://modelcontextprotocol.io/specification/latest/changelog,
  `.../2026-07-28/basic/lifecycle` (versioning), `.../2026-07-28/server/discover`,
  `.../2026-07-28/basic/transports/streamable-http`.
- Modern requests carry `_meta` keys `io.modelcontextprotocol/protocolVersion`,
  `io.modelcontextprotocol/clientCapabilities`, `io.modelcontextprotocol/clientInfo`;
  results carry `resultType` (`"complete"`) and SHOULD carry
  `_meta["io.modelcontextprotocol/serverInfo"]`. `server/discover` (MUST)
  answers `supportedVersions`, `capabilities`, `instructions`, `ttlMs`,
  `cacheScope`. `tools/list` (and resource and prompt lists) carry
  `ttlMs` and `cacheScope` (`"public"` or `"private"`); tools in a
  deterministic order.
- HTTP: every POST carries `MCP-Protocol-Version` (equal to the `_meta`
  value), `Mcp-Method`, and `Mcp-Name` on `tools/call`
  (`=?base64?...?=` for unsafe values); a mismatch or a missing header is
  400 with `HeaderMismatch` -32020; an unsupported version 400 with
  `UnsupportedProtocolVersion` -32022 and `data: { supported, requested }`;
  an unknown method 404 with -32601; a notification 202 with no body; an
  invalid `Origin` 403 (body MAY be a JSON-RPC error without `id`); GET or
  DELETE 405; `Mcp-Session-Id` and `Last-Event-ID` ignored, never minted.
- Dual era: an `initialize` request selects legacy semantics
  (`2025-11-25` and earlier); a request with modern `_meta` is served
  statelessly. A legacy client cannot fall forward; a modern client falls
  back on a 4xx without a recognized modern error. `ping`,
  `logging/setLevel` and the handshake are removed in the modern era.
- Tool errors are results with `isError`; `inputSchema` and
  `outputSchema` take any JSON Schema 2020-12; `x-mcp-header` is optional
  for servers.

## Planner facts (2026-11-12, at `1b99e6d4`)

- Built sizes: `apidata/` and `api/v1/catalog/` 105 files (54 chunks,
  average 63.6 KB, the largest file `api/v1/catalog/index.json` 70,114 B,
  3.97 MiB in all), 207 files at 3x, about 98 files left under 20,000;
  `apidata/roll/std.json` 30,125 B, `apidata/roll/alt.json` 32,103 B,
  `apidata/cards.json` 43,900 B, `apidata/records/index.json` 11,561 B.
- The service at `1b99e6d4` reads each roll file fresh and builds its
  index per request, and parses each result's whole chunk
  (`preview/api/service.mjs` `roll`, `getRecord`): the four chunk parses
  of a `std` roll are most of its CPU.
- `openapi.json` already names the tools: `list_rolls`, `roll`,
  `list_tables`, `get_table`, `get_record`, `get_homebrew_item`,
  `get_shared_list` (`x-mcp-tool`; no operation has `security`).
- The card-version map: `tools/build-share-pages.js` `cardVersions()`
  (40 bits of SHA-256 in base 36 over the og text of both stubs and the og
  picture bytes); `tools/build.js` writes it to `card-versions.json` after
  `tools/api-data.mjs` runs; the app reads it as `window.LOOT_V`
  (`data.cardVersion(id)`). The app's homebrew `?v` is `hash.ts`
  `cardVersion(record)`; a share link's is `cardVersion([name, note, n])`.
- `search.ts`: `rankHits(records, terms, statLine, hay)` and `matches`
  take a custom `Hay` (`{ names, texts }`, folded); `hitsAny` needs the
  term's `text` or `stemPrefix` as a substring of a field; `foldQuery`
  lowercases, folds Latin diacritics, `ё` to `е`, quotes and the minus.
  `#/search` also reads descriptions and, for equipment, the stat line.
- Filters: `filters.ts` `decodeFilter`, `groupsFor`, `passes`; the
  per-record values are `data.ts` `equipFacets` and `plainFacets` (pure);
  `TablesPage.svelte` composes them.
- File checks: `parseBundle(text, knows, owns)` and `parseHomebrew(text,
  ctx)` (`FileContext`: `catalogHas`, `catalogSet`, `catalogRef`,
  `ownItem`, `ownCard`, `lineMembers`); the report lines are built inline
  in `ImportPanel.svelte` (`fill(t.importErr...)`) and
  `HomebrewImport.svelte` (`hbImportErr...`).
- Import panels at `1b99e6d4`: `HomebrewImport.svelte` has a `.filerow`
  with `.links` ("Формат файла" to `/schema/homebrew-v2.json` and
  `llms.txt`); `ImportPanel.svelte` has a hint with inline links (the
  `import-v3` schema and "описание для ИИ-помощников" to `/llms.txt`).
  The footer nav (`Shell.svelte`) has install, privacy and terms through
  `app.pagesDir`; the static pages come from `tools/build-pages.js`
  `PAGES` and `pages/src/<id>.html`.

## Plan review measurements (reviewer, 2026-11-12, `reviews/plan-B2a.md`)

Read-only probes on this host (Node 24); production is about 4-10 times
slower than this host (B1's `std` roll: 7.5-17.5 ms there, 1.78 ms here).

| Probe | Result |
|---|---|
| `cardVersions()` from the `api-data.mjs` process under `ts-hooks` | works, 1.2 s; 1593 ids, every `buildIndex` id held, values 6-8 characters |
| B1 `std` roll CPU in memory (roll parse, `buildIndex`, 4 x 64 KB chunk parse) | 1.78 ms |
| B2a design, warm (cached index, 4 x decode and split, one line parse per result) | 0.50 ms (28 % of B1) |
| B2a design, cold (roll parse and `buildIndex` once more) | 0.84 ms (47 % of B1) |
| `foldQuery` over B3's search text (156 KB of `id`...`ru`,`en` lines) | 36 ms; 79 ms at 3x (470 KB) |
| `foldQuery` over the names only (87 KB) | 10.9 ms; `toLowerCase` of the same text 0.62 ms |
| split every B3 line into columns (244 KB today, 730 KB at 3x) | 1.9 ms today, 5.3 ms at 3x |
| names whose `foldQuery` differs from `toLowerCase` | 76 of 3186 |

- The live check of 2026-11-12 showed `/api/*` in `_routes.json` taking
  bare `/api` (the JSON 404); both `routed` test helpers assumed the
  opposite.
- `tests/app/states.js` asserts the footer's `.foot-nav a` hrefs
  (install, privacy, terms).
- `ImportPanel.svelte` `where()` and `skipLine()` name records through
  `app.index?.byId.get(id)` and `nameOf`; the report builders return
  structured lines (`pos`, `name`, `item`, `text`, `path`).
- The merge-back `1b99e6d4` differs from `origin/main` (`aeb68c0e`) only
  under `issues/` (`git diff --stat`); `1b99e6d4` and the planner commits
  are not pushed.

## B3 planner measurements (2026-11-12, at `8019493d`)

Local, this host (Node 24, `process.hrtime` medians of 60-200 warm runs;
the host was busy with the orchestrator's readings, so single runs
varied up to 2x). 3x is the tripled catalog of `tools/api-data.test.mjs`.
Scratch scripts, not committed (session scratchpad `b3bench.mjs`,
`b3bench2.mjs`, `b3f.mjs`).

| Probe | Today (1593 records) | 3x (4779) |
|---|---|---|
| search text, one line a record (5 codes, folded names, id, version, display names) | 204,426 B; display names alone 86,979 B | 619,650 B |
| shards at 262144 B | 1 | 3 (262,107, 262,108, 95,435 B) |
| code list sizes (source, kind, table, tier, rarity) | 16, 5, 19, 7, 6 | the same |
| cold prepare (UTF-8 decode, line starts) | 0.27-0.35 ms (decode 0.20 ms) | 0.85-1.17 ms (decode 0.73 ms) |
| warm query, real words (`меч`, `яд`, `зелье лечения`, `посох огня`, `armor plate`) | 0.07-0.26 ms | 0.17-0.72 ms |
| warm query `а` (1244 / 3732 matches, uncapped) | 1.66 ms | 4.59 ms |
| caps 300 kept lines and 3000 positions: worst accepted query of a 66-query sample (top 15 one-, two- and three-letter fragments of the names and 21 real words) | 0.51 ms (`ная`, 130 matches) | 0.55 ms (`armor plate`); one noisy run 1.22 ms |
| the same caps: refused queries | 28 of 66, all fragments; each refusal 0.2-0.7 ms | 45 of 66, all fragments; every real word answers |
| facet-only `kind=weapon` (`limit` 50) | 0.07 ms | 0.19 ms |
| parity with `rankHits` and a names-only Hay over every record, 20 queries | 20 of 20 | 20 of 20 |
| `f` on `apidata/table/eq_weapon/3.json` (the largest) | 24,305 to 39,493 B | about 118,479 B (budget 131072) |
| `parseBundle`, 32,607 B lists file, ok / 50 errors | 0.44-0.52 / 0.73-0.75 ms (CPU 0.47-0.78 ms a call) | - |
| `parseHomebrew`, 31 KB file with 2900-character texts, 1 / 19 errors | 0.52-0.58 / 0.50-0.53 ms | - |
| lists parser first, then the homebrew parser | 0.42-0.43 ms | - |

- A first scan design missed lines whose word holds the term's
  `stemPrefix` but not its `text` (`зелье лечения` 3 of 4); the needle
  rule of `plan.md` B3 (`[stemPrefix]` when it is a substring of `text`)
  fixed it, and a position inside the five code characters must not count.
- `apidata/records/index.json` already uses the format id
  `daggerheart-loot/api-records`, so the search answer is `api-search`.
- The production factor (local to Pages Metrics): B1's `std` roll 1.78
  ms here against p50 7.5 and p99 17.5 ms there (4.2x and 9.8x).

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
