# 2026-11-07 - Escape the Veiled Halls is one flat list with no rooms

- Task: `roll-per-line` (owner, chat 2026-11-07).
- Decision: `vh` is one table and one roll pool of 15, `vh1`-`vh15` rolled 1-15. The `room` field,
  the room picker, the `room` filter group, `app/src/lib/rooms.ts`, the `room` column of
  `catalog.csv` and `catalog-index.csv` and the `rooms` key of `names.json` are gone, with no new
  file name and no `version` 2 (both were added the same day, no reader is known; a reader by
  header name is unaffected). An old `f_room-*` link opens the whole table and a room anchor
  scrolls to nothing, with no redirect. The room map, for history: `vh1`-`vh4` The Basement,
  `vh5`-`vh8` The Dressing Room, `vh9`-`vh11` The Laboratory, `vh12`-`vh15` The Library (d4, d4, d3, d4).
- Rejected: an unused `room` field (dead data that `dataint` must pin); an empty `room` column and
  an empty `rooms` object (no break, but dead surface); new file names (more churn than the column
  is worth); a redirect for `f_room-*` (unknown groups fail open already).
- Accepted trade-off: a reader of the catalog's last column by position breaks.
- Amends "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh" (2026-11-07): the flat vh roll 1-15 is adopted; `room`, the room roll and the d3 are gone.
- Amends "A table sectioned by a record property reads one descriptor" (2026-11-07): `vh` leaves `SECTION_PROP`, which keeps `mwt` and `ph`.
