# 2026-09-26 - Homebrew in the owner's lists is a live reference; a copy that leaves is frozen

- Task: `persist-7-homebrew` (owner, 2026-09-26).
- Decision: adding an own homebrew item to a list writes `source =
  'homebrew'` with `snapshot` null - a reference resolved through the
  owner's live item, so an edit reaches every list holding it and every
  open shared page (the item's touch trigger bumps each referencing
  list's `revision`; the shared projection fills the reference from the
  item). A copy that leaves the account - "Save a copy", a request's
  add-to-my-list, an export, an add from an item link - carries
  `snapshot` = `homebrew_snapshot_of(key, content)` (the app's
  `snapshotOf`) and never changes. Deleting an item warns with the count
  of lists holding it, then a before-delete trigger removes those
  references; another account's frozen copies stay.
- Rejected: an immutable snapshot on every add (the 2026-09-25 proposal:
  a fixed typo stayed in every list); a foreign key from `item_key` (a
  frozen copy names a key its owner does not hold); dangling references.
