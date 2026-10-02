# 2026-10-01 - Search is one mode: words in any order, Snowball word forms, quotes for a phrase

- Task: `63` (owner's answers Q1-Q4, 2026-10-01; planner, pass 1).
- Decision: from task 63 every item search (`#/search`, each table box, the editor's item and line
  pickers) matches words in any order, each in one field of either language, as typed or by a
  shared Snowball stem of two or more characters from `@orama/stemmers` 3.1.18 (Russian and English
  entries only, pinned), checked on both sides so «зелёный» never answers "зелье" and "лук" never
  offers «клык»; a phrase in `"..."`, `«...»` or `“...”` matches as typed. No hit of the substring
  rule is lost. `#/search` and the pickers rank hits, names first; own items rank with the catalog,
  its record first on a tie; tables keep their order (`FEATURES.md`, "Tables and search").
- Rejected: a "basic | intelligent" setting (a synced preference, likely a migration, no hit to win
  back); a hand-written ending list (less precise, kept as the fallback); `snowball-stemmers` (38.7
  KB gzip, every language in one module); Fuse.js (offers «Драконий Клык» for "лук"); MiniSearch,
  Orama and FlexSearch (whole-word indexes lose in-word hits such as Longbow for "bow", and need a
  second index for own items); embeddings in a static asset (a 23-100+ MB model, about 490 KB of
  vectors); Supabase pgvector with an Edge Function (a migration, a new write path, a network call
  per query, an English-only model); a `-` exclusion operator (`-1` is a documented query).
