# 2026-10-08 - A lists file's homebrew entry may leave out its snapshot

- Task: `homebrew-followups` (owner, 2026-10-08: optional; planner: the skip at the parse, the re-read, no bump).
- Decision: in `import-v2` and `import-v3` a homebrew entry's `snapshot` is optional, in place. With one nothing
  changes. Without one, a key the account holds links its item, and any other key is skipped and named in the
  preview with its list and position (`parseBundle`'s `unheld`); the rest of the file imports. A kept entry
  without a snapshot whose item goes reads the file again with new ids; a skip whose item comes stays. The
  export writes a snapshot on every homebrew entry. No version bump: every file valid before stays valid.
- Rejected: keep it required (a hand-written file repeats every item of the homebrew file); remove it (a moved
  list loses its homebrew items, and old files hold snapshots); a version bump (an older reader refuses it
  too); a link to a copy the same file makes (the file's order would pick it).
- Accepted trade-off: a reader before this change refuses a file without snapshots whole; a skip whose item
  comes later stays until the GM chooses the file again.
- Supersedes in part "Homebrew travels as its own file; a lists file v2 carries frozen entries" (2026-09-30): `snapshot` is optional.
- Amends "An item is read by its id by anyone; a list holds a live link" (2026-10-07): only an entry with a snapshot imports as an own copy.
- Amends "`import-v1` bounds are the import call's ceilings, not the default limits" (2026-09-30): a required key may become optional in place, as a bound widens.
