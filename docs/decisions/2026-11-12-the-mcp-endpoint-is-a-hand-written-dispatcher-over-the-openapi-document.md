# 2026-11-12 - The MCP endpoint is a hand-written dispatcher over the OpenAPI document

- Task: `ai-mcp` (planner, 2026-11-12; owner AFK, recommended options taken).
- Decision: `preview/api/mcp.mjs` serves Streamable HTTP with one JSON answer per `POST /mcp`, in two eras:
  legacy (`initialize` for `2025-03-26`, `2025-06-18`, `2025-11-25`) and modern (per-request `_meta`, `2026-07-28`,
  with `server/discover` and the header checks). Tools are the `x-mcp-tool` operations of `openapi.json` without
  `security`; each call runs the REST adapter's `runOperation` in process.
- Decision: no session, no SSE, no CORS, `Origin` 403, `Authorization` never read, body cap 65536 B (it may rise, never fall).
  A legacy version is reached through `initialize`: a modern request that names one gets `UnsupportedProtocolVersion`.
- Decision: if the owner's connector test meets the `Origin` 403, the fallback is an allowlist of named cloud-client origins, and nothing wider: find the origin the client sends, add it as a constant, add a fixture for an allowed and a refused origin, and record the origin here.
- Rejected: `createMcpHandler` of the `agents` package (a dependency in a package that holds only `wrangler`, bundle size, `2026-07-28` support not confirmed);
  `McpAgent` (a Durable Object, stored state); the official SDK server (the same bundle and era questions);
  an HTTP hop from MCP to REST (a second Functions request per call).
- Evidence: `docs/specs/CONTRACTS.md` section 6, "MCP"; fixtures `docs/fixtures/mcp/`.
