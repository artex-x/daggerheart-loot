# 2026-09-25 - Account list writes are optimistic, queued in order, and retried; a refused write re-reads the account

- Task: `persist-2-lists` (owner answers 2026-09-25: save status, delete
  confirm, last write wins per entry; planner).
- Decision: `CloudLists` changes its in-memory list at once and queues one
  write per change, sent one at a time in order; a queued text edit of the
  same field is replaced, not appended. Every write is idempotent on
  client-made ids (`ListRepository.newId()`), so a retry cannot duplicate.
  A network failure keeps the queue, shows «Не сохранено - Повторить», and
  retries every 15 s, when the tab is shown again, and on the press. A limit
  or another refusal drops that write, toasts, and re-reads the account.
  The index and an account list page re-read on focus and every 45 s while
  no write is queued. Delete asks through `DialogPort.confirm`, names the
  share links, and has no undo.
- Rejected: pessimistic writes (the page waits on the network per key);
  a styled delete dialog (a new component for one question the port asks);
  a conflict dialog (owner: last write wins per entry).
