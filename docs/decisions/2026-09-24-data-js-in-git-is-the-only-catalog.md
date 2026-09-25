# 2026-09-24 - `data.js` in git is the only catalog authority

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
