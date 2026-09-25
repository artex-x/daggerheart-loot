# 2026-09-19 - A drop indicator redraws on a row's own note box when one is open

- Task: `dnd2` (find the commit with `git log --grep=dnd2`).
- Decision: an open note box (`.rnote`, `flex: 0 0 100%`) is a row's own
  last child, and covered `.lrow.drop-after`'s inset box-shadow, which
  paints below its element's children. `.lrow.drop-after .rnote` redraws
  the identical inset on the note; both rules paint when the note is
  open, but `.row`'s own bar is occluded, not absent. A doubled 6px bar
  is avoided only because `.row` carries no bottom padding, so `.rnote`'s
  border box lands on exactly the 3px the base rule draws into - add
  `padding-bottom` to `.lrow` and the mark splits into two lines.
- Rejected: an absolutely positioned `::after` bar - immune to a future
  opaque child, but needs `position: relative` on `.lrow`, a larger blast
  radius than the defect earns; a transparent `.rnote`, trading a visible
  defect for a visible redesign of a surface (`--bg2`) meant to read apart.
- Evidence: measured against `dist/` - a marked row's bottom 200x3 px strip
  read 0/600 gold pixels noted, 400/600 closed, list end and middle alike.
