# 2026-09-26 - Homebrew is reached from the account menu, not from a tab

- Task: `persist-7-homebrew` (owner, 2026-09-26).
- Decision: `#/homebrew`, `#/homebrew/new` and `#/homebrew/<key>` are
  routes with no tab current, reached from the account menu's «Мои
  предметы» / "My items" entry (the menu R5 builds from the header's
  account control: display settings, my lists, my items, sign out), from
  the search group's heading and from an own record's «Изменить».
  `SECTIONS`, the pin and the ten section names of `docs/specs/ROUTES.md`
  do not change; the Lists tab is removed at the cutoff by R5.
- Rejected: an eleventh tab (every golden moves with the tab bar, the
  pin and `SECTIONS` change, and a signed-out reader gets a tab that only
  asks to sign in); a page under the Lists tab with a link on the lists
  index (the 2026-09-25 proposal: the Lists tab goes away at the cutoff,
  and the owner wants the account's things behind the account control).
