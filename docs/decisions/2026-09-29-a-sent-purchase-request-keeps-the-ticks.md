# 2026-09-29 - A sent purchase request keeps the ticks; the send waits until they change

- Task: `persist-4b-requests-polish` (planner, 2026-09-29, on the owner's feedback; the owner waived the review).
- Decision: a successful send keeps the ticked entries and their taken
  counts, so the reader can still copy or print them. The button then
  reads «Запрос отправлен» / "Request sent" and is disabled while the
  ticked entries and counts are the ones sent; a changed tick or count,
  «Снять выделение» or leaving the page ends it. The sent mark is memory
  only (`RequestSender`). A ticked entry the shared list no longer holds
  leaves the selection (`FEATURES.md`, "Account and browser lists").
- Rejected: an enabled button after the send (a second press sends the
  same request twice, and the owner answers it twice); the sent mark in
  `sessionStorage` (a request leaves nothing in the browser).
- Amends "A requester sees no request status; the send toast is the only answer" (2026-09-27): the send button reads «Запрос отправлен» while the sent ticks stay.
