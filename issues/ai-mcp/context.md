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
- Open questions: the outline below, "Open design questions". No owner
  question is open in `plan.md`.

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

## Do not re-fetch unless
- Human provides new info
- context.md is missing a fact you need
- You suspect drift vs issue or plan
