# 2026-09-24 - The laws of no backend and of `file://` are superseded

- Task: `persist-0-foundation` (owner decisions of this date).
- Decision: three `CLAUDE.md` laws are replaced. "Project shape": "It runs
  from `file://` too." - the app is served over HTTP only. "Architecture
  boundaries": "Preserve relative asset paths and the classic-script data
  adapter required by `file://`; do not use runtime `fetch()` for local
  data." - both stay, for caching and a synchronous boot. "Product laws":
  "Lists live in the URL hash and localStorage; add no backend or upload
  service." - a Supabase backend holds accounts, cloud lists and homebrew,
  and no other server is added. The replacement text, as this date's
  entries settle it, is `docs/specs/META.md` sections 3, 4 and 9 and
  `CONTRACTS.md` sections 4-5.
- Rejected: keeping the laws with a list of exceptions - every persistence
  batch would open with a law conflict.
