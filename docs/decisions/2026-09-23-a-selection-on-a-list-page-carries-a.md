# 2026-09-23 - A selection on a list page carries a taken count per entry, in memory, defaulting to the whole stock

- Task: `50`.
- Decision: ticking an entry takes its whole quantity; a count field narrows
  it to 1..quantity. The count lives in memory beside the selection it
  belongs to (`AppState` for the shared page, `ListPage` for an own list) and
  is cleared with it. Removing the selection from an own list takes the
  counts: a partial count lowers the entry's quantity, a full one removes the
  entry, and one undo restores both. Adding the shared page's selection to a
  list carries the taken count as the new entry's quantity.
- Rejected: a default of 1 - silently changes what "Удалить (N)" and the
  bar's add-to-list already do for a ticked stack; turning `app.sel` into a
  map - touches every table and search caller for a list-only need; a count
  in the address or the list link - a public-contract change for state
  `STATE.md` keeps out of storage and links; a separate cart - a second
  selection model beside the one the pages already have.
