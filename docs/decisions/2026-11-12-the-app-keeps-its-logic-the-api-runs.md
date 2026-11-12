# 2026-11-12 - The app keeps its logic; the API runs the same pure modules

- Task: `ai-mcp` (owner question, 2026-11-10; planner, 2026-11-12).
- Decision: the app and the API are two entry points to one implementation of each rule: the pure modules of
  `app/src/lib/`, which the app imports and the worker bundles (`rollTables.ts` moved out of `App.svelte`,
  `apiRecord.ts` built only from existing functions). `data.js` is the one catalog authority; `apidata/` is
  rendered from it at build time. Fixtures (`docs/fixtures/api/v1/`, compared byte for byte), `tests/contracts.js` and
  the parity tests (the lean pool equals the app's pool; a fixed `random` gives the panel's record) enforce it.
  Each new operation costs a service function, an `openapi.json` entry and a fixture; a rule a component
  computes must first move into a pure module. Revisit rule: if a parity test fails twice on a change that
  touched one side only, or a review finds a rule implemented twice (in `preview/api/` and in `app/src/`),
  that one area moves behind the API in its own batch.
- Rejected: the app as an API client (a loading and a failure state on every page, a quota burn takes the app
  down, no runtime `fetch()` for local data, no offline use); a second implementation in the worker (two rules
  drift); rendering at request time from the full `data.json` (896 KB to 1.1 MB against 10 ms).
