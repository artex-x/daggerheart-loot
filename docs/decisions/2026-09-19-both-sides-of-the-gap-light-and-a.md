# 2026-09-19 - Both sides of the gap light, and a cancelled drag is shown, not worded

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: "after 3" and "before 4" are one place, so both rows beside the
  gap carry the existing gold inset. The component derives the pair from the
  unchanged `onOver(over, where)` callback, so no port contract moves.
  Cancelling is signalled rather than worded: outside the zone the
  highlights go out and the cursor refuses the drop, which is what Escape, a
  release outside the list and a drag off the page all look like.
- Rejected: one line drawn in the gap itself (it needs a node inside a flex
  column whose rows are `overflow: hidden`, so it either shifts every row
  below it or forces `position: relative` onto a shared `.rows` rule); an
  explicit Escape key handler (the native drag already consumes Escape and
  fires `dragend`, and a second mechanism for one effect is a second thing
  to keep true); a hint string in `dict.ts` (a tooltip is read before the
  drag, not during it, which is when cancelling is decided).
