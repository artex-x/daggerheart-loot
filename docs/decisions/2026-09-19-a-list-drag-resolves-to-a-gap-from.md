# 2026-09-19 - A list drag resolves to a gap, from the document, not to a row

- Task: `dnd` (find the commit with `git log --grep=dnd`).
- Decision: `nativeDrag` resolves the pointer to a gap index - the number of
  rows above the landing place - from the capturing document `dragover` it
  already binds for edge-scroll, against row midpoints cached at `dragstart`
  in document coordinates. The drop zone is the rows box grown by one
  measured row gap above the first row and below the last. There is no
  horizontal test, so the zone is a band. `drop` moves to the same document
  listener, so every position the highlight promises also accepts a release.
- Rejected: keeping the row-level `dragover` and widening what counts as a
  hit (the 8px `.rows` gap is not a row, so the early return that is the
  defect survives in some form); recomputing row rectangles on every
  `dragover` (a forced layout per frame, and rows cannot move during a
  drag); a horizontal bound on the zone (a person aiming between rows drifts
  vertically, and nothing sits beside the rows on this page).
- Evidence: the comment above `onDocOver` already recorded that the pointer
  spends most of a drag over the gaps between rows; only the scroll was
  moved to the document, never the targeting.
