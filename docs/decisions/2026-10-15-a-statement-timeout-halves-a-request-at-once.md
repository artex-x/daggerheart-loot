# 2026-10-15 - A statement timeout halves a request at once

- Amended by "An account delete removes its purchase requests in bounded calls first" (2026-10-16): the 3x delete ships, and D83 is paid.
- Task: `debt-cleanup` (planner default, 2026-10-08; plan review before B1, 2026-10-15).
- Decision: an `apply_list_writes` call that the database stops at its statement timeout (HTTP
  500, `57014`) answers `{ ok: false, error: 'fault', timeout: true }` (`app/src/ports/supabase.ts`,
  `callFailure`). `CloudLists.#send` halves such a request of more than one write at once, with no
  15 s wait, no counted fault and no «Не сохранено»; a lone write stopped so keeps the counted
  fault path. Measured 2026-10-15 on this host under `statement_timeout = '4s'`: 150 lists of
  300 entries delete in one call in 172 ms; `delete_account()` at three times every limit took
  20-23 s (seed 34-37 s), so its case is a todo and `docs/specs/DEBT.md`, "D83", keeps it.
- Rejected: the counted path for a timeout too (a 200-write request waited about a minute and
  showed «Не сохранено» for writes that a smaller call takes at once); splitting to single writes
  at once (up to 200 calls where eight halvings reach one write); a chunked account delete in
  this batch (a new write path on the one irreversible call, past the batch's scope).
- Amends "A request the database fails three times is halved; a lone write is dropped"
  (2026-09-26): a statement timeout of more than one write halves at once.
