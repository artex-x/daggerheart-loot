# 2026-10-22 - The owner's requests read takes every head and the open list's lines

- Task: `persist-review` (owner, decision 51: P1 and P26 "Implement now", 2026-10-22).
- Decision: `RequestRepository.list()` pages the heads of every pending request with no lines;
  `lines(ids)` reads the named pending requests with their lines in chunks of 50.
  `OwnerRequests` reads the lines of the focused list's requests at `focus` and for each new one,
  keeps them while the request is pending, marks a list read only when it holds the lines of each
  of its pending requests, and has a `status`. `lists.list` and `homebrew.load` read the limits
  with a whole read, or after a limit read of the same repository failed; a re-read reads none
  (`app/src/ports/supabase.ts`, `app/src/state/ownerRequests.svelte.ts`).
- Rejected: a lines read by list (every line again per signal); a page of 100 requests (keeps
  110 MB at 3x); a nullable `OwnerRequest.lines`; a `my_limits()` RPC (a migration).
- Accepted trade-off: the panel draws a new request of the open list one round trip after its
  head; a limit raised while the page is open shows after the next page load.
- Amends "The account re-read fetches only the lists whose revision moved" (2026-10-02): the requests panel's lines load for the open list only, and a re-read reads no limit.
