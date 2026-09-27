# 2026-09-27 - A requester sees no request status; the send toast is the only answer

- Task: `persist-4-requests` (owner's feedback on the mocks, 2026-09-27: "as a player I would not care much, it is more relevant for DM to keep their list up-to-date"; planner, the removal).
- Decision: a share page draws no status of the requests it sent. The
  send answers only success or a refusal, shown as a toast;
  `create_purchase_request` returns nothing, no key or request id leaves
  the database, and the requester's browser stores nothing. An applied
  request lowers the entries, which the open share page redraws like any
  owner edit. Request events go to the owner topic only.
- Rejected: the status block of pass 1 (the player does not care; it
  cost a status key column, an `anon` read function, a share-topic event
  and a `sessionStorage` key); a status line shown only while a request
  is pending, or a one-line block (the same machinery for less).
- Accepted trade-off: the player does not learn of a decline or expiry.
- Supersedes "A requester reads the status by a key kept in the tab's sessionStorage" (2026-09-26).
- Amends "Request events nudge the owner and share topics; each page refetches" (2026-09-26): no event on the share topic.
