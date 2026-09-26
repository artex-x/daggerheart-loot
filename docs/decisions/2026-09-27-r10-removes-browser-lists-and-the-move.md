# 2026-09-27 - R10 removes browser lists and the move; an old `#/l/` link is not found

- Task: `persist-5b-account-menu` (owner, 2026-09-27, relayed from the R5 session).
- Decision: after `LEGACY_WRITE_UNTIL` (2026-10-26), R10 (`persist-10-legacy-removal`, the
  first release after the date) removes browser lists and all move support: the app never reads,
  draws or moves `dhloot.lists.v2` again. It removes the codec, the `#/l/` list and retired
  pages, `ListStore`'s browser lists, `LegacyMove`, `MoveNotice`, `MoveStatus`, `StorageNotice`
  and the move's RPC path, and plans whether a migration drops `move_legacy_list` and
  `lists.legacy_fingerprint` (`DEBT.md` D62, D63). The browser's data is not deleted. From R10
  an old `#/l/` link draws the not-found page, the address kept (a contract change in R10).
- Rejected: deleting the local data (a write on a client clock that no reader asked for); a
  one-line retired page for `#/l/` (a page kept for a link format that no longer exists); the
  move past R10 for a reader who never signed in (`LegacyMove` and the notices with no end).
- Supersedes in part "The `#/l/` link decoder retires at the legacy write cutoff" (2026-09-24): from R10 `#/l/` draws the not-found page, not a retired page.
- Supersedes in part "After the cutoff a browser list is written only by the move and a delete" (2026-09-26): from R10 nothing reads, draws, moves or deletes a browser list.
