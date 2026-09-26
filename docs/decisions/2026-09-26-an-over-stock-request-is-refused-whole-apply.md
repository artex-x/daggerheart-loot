# 2026-09-26 - An over-stock request is refused whole; Apply available clamps; zero removes

- Task: `persist-4-requests` (owner answers 32 and 37, 2026-09-24).
- Decision: `apply_purchase_request(id, clamp)` runs in one transaction.
  Without `clamp`, a line above the entry's current stock (a deleted entry
  has none) refuses the whole request, changes nothing and answers the
  short lines; the owner's panel then offers «Принять доступное», which
  calls it with `clamp` and takes what each entry has. Each line records
  the quantity it took. An entry whose stock reaches zero leaves the list,
  as a full «Удалить (N)» does.
- Rejected: always clamp (sells what is not there without the GM
  noticing); keeping an entry at zero as "sold out" (a new state for every
  list view and print card).
