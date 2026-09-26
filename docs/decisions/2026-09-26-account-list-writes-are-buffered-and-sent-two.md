# 2026-09-26 - Account list writes are buffered and sent two seconds after the last edit

- Task: `persist-5-migration` (owner, 2026-09-26: the buffer, and option C at a tab close; planner, passes 4 and 5).
- Decision: `CloudLists` keeps every account list write, list create
  and delete included, in one ordered buffer; each change restarts one
  2 s timer, and the flush then sends the buffer in order, edits of one
  field merged into the last, as one `apply_list_writes` request (more
  only past 60 000 bytes or 200 writes). It is sent at once when the tab
  is hidden or closed (a `keepalive` request), on sign-out (at most 5 s),
  and before «Поделиться», a `#/s/` copy and the move of browser lists.
  «Сохраняем...» shows from the first buffered edit. HTTP 401,
  `PGRST301`, `PGRST303` and `28000` are `network`: the write stays.
- Rejected: a write per edit (about 50 requests for one note); a
  debounce per field (a create and its edits could cross); a chain of
  writes per flush (a closed desktop tab kept only the first).
- Amends "Account list writes are optimistic, queued in order, and retried; a refused write re-reads the account" (2026-09-25): writes wait in a 2 s buffer, go as one request, and a lapsed session is retried.
