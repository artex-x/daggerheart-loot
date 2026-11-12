# 2026-11-12 - The read API and MCP are one stateless worker over build-time projections

- Task: `ai-mcp` (owner, 2026-11-10: option (c), Q3 = A; planner, 2026-11-12).
- Decision: `/api/v1/*` and `/mcp` are answered by the Pages worker over one service layer
  (`preview/api/service.mjs`). The catalog reaches it as build-time projections (`apidata/`, rendered by
  `tools/api-data.mjs` from `data.js` with the app's own modules), read through `env.ASSETS`; it also reads
  `get_homebrew_item` and `get_shared_list` as `anon` with a 65536 B cap (about 1.6-2.6 ms of CPU at the rate
  measured on 2026-10-14; past it the answer is 422 with the app link). The cards rejected these full reads
  because a card needs the lean projection; a client needs the whole item and the whole list. The worker
  still stores nothing; the law sentence of `CLAUDE.md` names the read API and the MCP endpoint.
- Rejected: MCP-only logic (a second consumer re-implements it); a Supabase-hosted API (a second authority or a
  deploy per data change, a project-ref URL, a broad access token, a third runtime); the catalog in Postgres
  (the rejection of 2026-09-24 holds); an HTTP hop from MCP to REST (a second request per call); a projection
  file per record (the file count at three times the records).
- Amends "Link previews come from a stateless worker" (2026-10-14): the same worker also answers the read API and the MCP endpoint.
