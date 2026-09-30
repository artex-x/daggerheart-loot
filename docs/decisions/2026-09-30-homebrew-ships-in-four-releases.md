# 2026-09-30 - Homebrew ships in four releases: items, catalog pages, relations, files

- Task: `persist-7-homebrew` (owner's answer to Q6, 2026-09-30; planner, pass 4).
- Decision: R7 `persist-7-homebrew` (own items with sources and sections, the editor, lists, shared
  pages and print), R7b `persist-7b-homebrew-catalog` (the `homebrew` table, the equipment tables,
  one merged search, the show/hide chip), R7c `persist-7c-homebrew-relations` (the catalog's `craft`
  as a list, upgrade lines, craft links, sets, rule cards, their drawing on catalog cards), R7d `persist-7d-homebrew-files` (the
  two file formats, `llms.txt`, import and export). Each deploys alone; each cut is a public
  contract or a migration with its own review; the file format goes last so v1 carries every field.
- Rejected: two releases, R7 with relations and a files release (about two hours of gates fewer,
  but the first production use waits for relations); a split per source (a source is the author's
  data, not a part of the code).
