# 2026-11-07 - A table sectioned by a record property reads one descriptor

- Amended by "Escape the Veiled Halls is one flat list with no rooms" (2026-11-07): `vh` leaves `SECTION_PROP`, which keeps `mwt` and `ph`.
- Task: `new-items` (the plan, 2026-11-05: extract the shared mechanism on its second real use).
- Decision: `app/src/lib/sectionProps.ts` `SECTION_PROP` names, per table, the record field that
  sections it (`mwt` `realm`, `ph` `vol`, `vh` `room`), its values in book order and their names.
  The tables page's sections, the facet row, the record path's last leaf (`whereFrom`) and the
  roll picker (`sections.ts` `sectionParts`, `sectionGroup`) read it. The field name is the filter
  group (`f_vol-2`, `f_room-library`); `realm`'s data, address and filter value do not change.
  The badge and the print card keep the realm name for `mwt` (a realm is a card set) and the book
  name for `ph` and `vh`. A catalog rule card whose `url` is not on `ru.daggerheart.su` links to
  its address as written, with the host as its text, as an own rule card does.
- Rejected: a fourth and fifth hard-wired copy of the realm branches (three copies of one
  mechanism in six files); a flat Pistolheart table with the volume only in the path (the
  sections cost no new component); the room or volume name on the badge (a room is not a book).
