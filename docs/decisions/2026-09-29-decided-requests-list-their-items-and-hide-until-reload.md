# 2026-09-29 - Decided requests list their items and hide until the next page load

- Task: `persist-4b-requests-polish` (planner, 2026-09-29, on the owner's feedback; the owner waived the review).
- Decision: the owner's fold «Решённые в этот раз (N)» lists each decided
  request's items with the asked count, and «Скрыть» forgets this page
  load's decisions for the list; the panel then goes when nothing is
  pending (`OwnerRequests.forget`; `FEATURES.md`, "Account and browser
  lists").
- Rejected: a history read from the database (a second read on every poll
  and topic message, decisions of other devices, and a stored list of
  hidden ids); sums on decided lines (wrong for a clamped apply); hiding
  the panel while a request is pending (the request would be missed).
- Accepted trade-off: decisions made on another device are not listed.
