# 2026-09-26 - A requester reads the status by a key kept in the tab's sessionStorage

- Superseded by "A requester sees no request status; the send toast is the only answer" (2026-09-27).
- Task: `persist-4-requests` (owner answer 34, 2026-09-24; planner, the storage).
- Decision: `create_purchase_request` answers a random `status_key`; the
  page keeps the last five per link in
  `sessionStorage['dhloot.requests.v1']` and reads them through
  `get_purchase_requests(keys)` (`anon`, at most five keys): status -
  pending, applied, declined or expired - and the request's own lines with
  the quantity each took. Nothing about the owner, the list or the link
  is in the answer. A key the database no longer holds is dropped.
- Rejected: fire and forget (a player who records items elsewhere needs
  to know the GM applied them); `localStorage` (outlives the session and
  shows one reader's requests to the next person at a shared computer);
  the account (signed-out requesters have none).
