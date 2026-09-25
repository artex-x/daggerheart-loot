# 2026-09-23 - Many lists: the index shows 24 cards at a time; a record's own lists lead its menu

- Task: `68`, the owner's answers to the planner's Q1 and Q2.
- Decision (Q1 = B): the index draws 24 cards (`LIST_PAGE`) of what the
  filter leaves, then «Показать ещё (N)» / "Show more (N)", N still hidden;
  a press adds 24 and focuses the first new card; a query edit folds back
  to 24. The count is session memory (`AppState.listsShown`, as `printBW`
  is): a return from a list keeps it, a reload does not.
- Decision (Q2 = A): a one-record menu puts the lists holding the record
  first, newest first in each group, in the order taken when it opens.
- Rejected, Q1: A, every card drawn (the planner's pick; 11 phone screens
  at 50 lists); C, a compact view in `dhloot.prefs.v1` (stored state, a
  second layout); page numbers (lost on Back without a route change);
  folding back on every return; the count in the address or storage.
- Rejected, Q2: B, newest first everywhere (at 50 lists, membership spread
  over 2200 px); re-sorting on a press (the chip moves under the pointer).
