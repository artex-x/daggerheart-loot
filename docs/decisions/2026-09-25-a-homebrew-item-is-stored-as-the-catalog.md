# 2026-09-25 - A homebrew item is stored as the catalog record shape in one jsonb column, under a per-owner `hb_` key

- Task: `persist-7-homebrew` (planner, 2026-09-25).
- Decision: `homebrew_items.content` holds the `Record_` fields a homebrew
  record may carry (`kind`, `en`, `ru`, `ende`, `rud`, `tier`, `eq`) and
  nothing else; `public.homebrew_content_valid(jsonb)` and
  `validateDraft()` (`app/src/lib/homebrew.ts`) enforce the same enums
  and bounds over the same fixtures. Names are 120 and descriptions 3000
  code points per language, so a record stays under the 16384-byte
  snapshot bound of `list_entries`. The key is `hb_` plus 16 lowercase
  base32 characters, made by the client, unique per owner; the prefix is
  reserved in `docs/specs/CONTRACTS.md`. Both languages are optional with
  at least one name; a missing language is drawn from the other one when
  the record is built, never stored.
- Rejected: one typed column per field (a second shape beside the form,
  the snapshot and the bundle, and a migration for every field a later
  release adds); a global unique key (nothing needs it: a clone makes a
  new key, an import keeps the bundle's keys per owner); widening the
  snapshot bound (the text caps size the record under it); requiring
  both languages (a GM at a Russian table writes one).
