# 2026-11-12 - API v1 is public read, frozen, with a v2 beside it for a break

- Task: `ai-mcp` (owner, 2026-11-10: Q1, Q2 = A, CORS; planner, 2026-11-12).
- Decision: `/api/v1/` is public and read-only (tier T0, no key; an `Authorization` header is ignored and never forwarded).
  Its paths, parameter names, field names, `format` values and CORS rule are frozen once published
  (`docs/specs/CONTRACTS.md` section 6); a new optional parameter, field, resource or wider value list changes in place,
  and anything else is `/api/v2/` beside v1. `openapi.json` is the one source for the MCP tools. The API serves the neutral
  record only: there is no `format=` parameter and no published mapping, and every consumer maps as it wants (Q1). It serves
  every source (Q2 = A), each record with `rights`. Every answer carries `Access-Control-Allow-Origin: *` and no
  credentials, and `OPTIONS` answers 204, so a browser tool calls the API without a proxy; `/api/v1/me/` is reserved.
- Rejected: API keys now (no store to meter with); no CORS (every browser tool needs a proxy that costs the same quota);
  an `Origin` allowlist on T0 (a deploy per client); a per-target payload or a published mapping (a moving third-party
  schema); cursors and sort parameters (whole tables and tier parts are small); Core and Hope & Fear only (Q2 = B: the
  supplements are most of the value).
