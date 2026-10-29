# 2026-10-28 - R10 drops the move function and the fingerprint column

- Task: `persist-10-legacy-removal` (owner, 2026-10-01, Q1 B).
- Decision: `supabase/migrations/20261028120000_drop_legacy_move.sql` drops `move_legacy_list`, the
  `dhloot.move` guard in `lists_limit` and `list_entries_limit`, and `lists.legacy_fingerprint` with
  its index; its reversal restores the shape and the guard, not the fingerprint values. It closes
  D62: no database function inserts past a count limit.
- Rejected: A, keep the column until a later schema release (dead schema with no owner); C, revoke
  EXECUTE only (dead SECURITY DEFINER code and its Security Advisor row stay).
- Accepted trade-off: a tab on a pre-R10 build fails its account list reads until it reloads, and
  no app-only revert exists after R10 (`.claude/README.md`, "To undo
  `20261028120000_drop_legacy_move`").
- Supersedes in part "A browser list moves through one RPC that hashes its canonical text" (2026-09-26): the function, the guard and the column.
