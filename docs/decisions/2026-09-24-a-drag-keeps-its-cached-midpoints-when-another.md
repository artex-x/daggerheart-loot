# 2026-09-24 - A drag keeps its cached midpoints when another tab rewrites the list

- Task: `debt-cleanup`; was DEBT D42 (`git show 7b0def9:docs/specs/DEBT.md`), closed
  as a kept design.
- Decision: the accepted cost of "A list drag resolves to a gap"
  (2026-09-19). Row midpoints are measured once, at `dragstart`, in
  document coordinates (`app/src/ports/drag.ts`). A second tab writing the
  same list mid-drag re-renders the rows through the storage merge; the
  highlight and the drop then land at the old layout's gap.
- Rejected: re-measuring every row on each `dragover` (undoes the caching
  decision); a mid-drag `onExternalChange` hook on the drag port (a port
  surface for a sub-second window that needs two tabs editing one list).
- How to see it: start a drag in one tab, write a reorder to the same list
  from a second tab mid-drag; the highlight tracks the cached order.
