# 2026-10-28 - R10 deletes the date gates; a build with no sign-in has no lists

- Task: `persist-10-legacy-removal` (owner AFK, recommended option; the removal is the owner's).
- Decision: with browser lists gone, the code that waited for their date goes too: `legacyWritable`,
  `localWritable`, `moveDue`, the Lists tab (the bar draws five tabs in every build), `sectionLabel`'s
  third parameter (`#/lists` is «Мои списки» everywhere), `?today=` and the driver's `today`. The
  test build keeps a fixed clock (`TEST_NOW`, 2026-10-01 12:00 UTC) for export names and relative
  times. `<main data-move>` becomes `data-lists` and the driver verb `moveSettled` becomes `settled`.
  A build with no sign-in has no lists: `#/lists` and `#/lists/<id>` draw the not-found page, the
  address kept, and no add-to-list control is drawn. An old `#/lists/<local id>` bookmark draws the
  list page's not-found state.
- Rejected: keep `?today=` as a general test clock (no state uses it after R10; a switch with no test
  is dead code); keep browser lists in a build with no sign-in (a second list model for a build that
  production never ships); keep the `dhloot.migrated.v1` redirect (it is move support, needs `ListStore`).
- Supersedes in part "The test build's clock is pinned before the cutoff, and `?today=` moves it" (2026-09-26): the day switch; the fixed clock stays.
- Supersedes "Browser lists are read-only while the move is due" (2026-09-26).
