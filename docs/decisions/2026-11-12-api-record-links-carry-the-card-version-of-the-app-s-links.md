# 2026-11-12 - API record links carry the card version of the app's links

- Task: `ai-mcp` (owner, 2026-11-12).
- Decision: a record's `link` equals what the app hands out: `<site>i/<id>?v=<v>`, `<site>i/en/<id>?v=<v>`, `<site>h/<uuid>?v=<v>`.
  A record without a card version has no `?v`. The `?v` is opaque. The canonical `og:url` is the link without its query.
- Decision: v1 documents `link` as a URL to store, not a path form to build, so the change is not a break; every `rev` changes once.
- Rejected: the bare URL (a pasted link keeps a stale messenger preview); a second field for the versioned URL (two URLs for one thing).
- Evidence: `docs/specs/CONTRACTS.md` section 6, "Links"; `app/src/lib/apiRecord.ts`.
