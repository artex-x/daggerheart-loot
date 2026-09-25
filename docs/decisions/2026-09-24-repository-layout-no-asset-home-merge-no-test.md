# 2026-09-24 - Repository layout: no asset-home merge, no test colocation, `pages/src/` stays

- Task: `debt-cleanup` (owner's answers to a structure review).
- Decision: the root layout stays. `npm run dev` serves the root files the
  build links into `dist/` (`vite.config.mts`, `rootFiles()`).
- Rejected: one asset home for `img/`, `og/`, `card/` (under `app/public/`
  Vite copies ~90 MB per build; under `assets/` the published URLs stay
  frozen anyway, ~90 citations and ~3200 renames for no behaviour, and it
  contradicts "Share stubs (`i/`) and artwork (`img/`, `og/`) stay tracked
  root folders"); one test file per component (tests already sit in
  `app/src/components/`, and `perFile` coverage rejects a filename match);
  moving `pages/src/` out of `pages/` (a hook, its selftest cases, CI,
  `tests/derived.js` and two specs for tidiness: production never publishes
  `pages/src/`, only the local `dist/` junction exposes it). Revisit the
  last when a new static page is built anyway.
