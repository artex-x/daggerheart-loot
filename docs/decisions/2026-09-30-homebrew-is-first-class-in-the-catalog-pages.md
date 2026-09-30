# 2026-09-30 - Homebrew is first-class in the catalog pages; the roll pages are excluded

- Task: `persist-7-homebrew` (owner's items 10-11 and answer to Q2, 2026-09-30; planner, passes 2-4).
- Decision: from R7b own records join `allEquip` (the three equipment tables, in their tier
  sections), `searchable` (one merged result list; the tag tells them apart) and a table `homebrew`
  in `TABLE_IDS` (`#/tables/homebrew`, sectioned by source and section, facets `kind`, `src` and
  `sect`, its group chip drawn only signed in); the equipment tables' `src` facet appends `hb` and
  each source key. A memory-only chip «Хоумбрю» (pressed = shown) on `#/search` and the equipment
  tables hides own records for the visit and is not in the address. The search intro keeps the
  catalog count and adds «И N ваших предметов.» when the account has items. Roll pools stay the
  catalog's.
- Rejected: a separate search group (not first-class); a `hb` filter group in the frozen grammar (a
  private narrowing nobody else can open); an eleventh tab; homebrew in the roll pages (the owner,
  for now).
- Amends "Homebrew is reached from the account menu, not from a tab" (2026-09-26): no search group heading; the `homebrew` table's group chip leads there too.
