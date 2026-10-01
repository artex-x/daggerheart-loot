# 2026-10-01 - Homebrew sections stay in the source row: no sections table, no parent books

- Task: `persist-7b-homebrew-catalog` (owner, 2026-10-01, after `B7b.1`; planner).
- Decision: a source's sections stay a list inside its row,
  `homebrew_books.content.sections` (`{ key, en?, ru? }`, at most 30, keys unique in the
  source), and an item names one by `content.section`. The schema has no sections table
  and a source has no parent. The `sect` facet, the anchors on `#/tables/homebrew`, the
  headings, the path leaf and both file formats read that one shape.
- Rejected: a `homebrew_sections` table with a foreign key from the item (a section is only
  a name and a key; a second table adds a join, its own limit, row level security and a
  delete cascade, and R7 shipped the list); sections as `homebrew_books` rows with a
  `parent_id` (a section would count against the source limit and could hold sections of
  its own; a shared book of D7 is one row a reader subscribes to, not a tree).
- Amends "A homebrew source may hold sections, as the community book holds communities" (2026-09-30): the owner confirms the shape and rejects parent books.
