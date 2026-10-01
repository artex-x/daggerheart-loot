# 2026-09-30 - A homebrew source may hold sections, as the community book holds communities

- Amended by "Homebrew sections stay in the source row: no sections table, no parent books" (2026-10-01): the owner confirms the shape and rejects parent books.
- Task: `persist-7-homebrew` (owner's mock review of 2026-09-29 and answer to Q10, 2026-09-30; planner, pass 3).
- Decision: a source's row holds `sections [{ key, en?, ru? }]` (at most 30; `hb_` keys unique
  in the source by the database; names unique in the source by the client, without case); an item
  names one by `section`. Sections head the items on `#/homebrew` and,
  from R7b, on `#/tables/homebrew` with a `sect` facet and anchors; they add a leaf to the path line
  and the print source line, while the tag stays the source. Deleting a section keeps its items in
  the source. Both file formats carry sections from their first version.
- Rejected: separate sources per category (the owner asked for the community split); a text tag on
  each item (a rename rewrites every item; item 13's books need ids); a table of sections (a section
  is only a name).
