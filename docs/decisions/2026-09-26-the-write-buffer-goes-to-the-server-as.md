# 2026-09-26 - The write buffer goes to the server as one invoker RPC with a result per write

- Task: `persist-5-migration` (owner, 2026-09-26: Q1 option C, and `P0002` for a gone row; planner, passes 5 and 6).
- Decision: `apply_list_writes(p_ops jsonb)` (`20260925130600`) applies up to 200 writes
  (create with entries, update, remove, add, update entry, remove entries, reorder) in order,
  each in its own subtransaction, as `security invoker`: row level security and the count
  limits apply as to a plain write. It answers one result per write, so a limit or a refusal
  drops that write alone. An update, update entry, reorder or add whose row is gone or hidden
  answers `P0002`: the client drops it with no toast, with that list's (for an entry, that
  entry's) buffered writes, and reads the account again. A serialization failure or a
  deadlock fails the call, which the client sends again. Writes are idempotent on client-made
  ids; a replay can answer `23505`, `22023` or `P0002` for a write a later write undid, or
  make again a list deleted meanwhile. `ListRepository.apply` replaces seven write methods.
- Rejected: `security definer` (it bypasses row level security and repeats every owner
  check); all-or-nothing (one refusal would undo the edits beside it); a ledger of applied
  batches (a table for a replay the ids make safe); `ok` for a gone row (a false «Сохранено»).
