# 2026-09-30 - (HB) marks homebrew, and a homebrew relation shows only to its author

- Task: `persist-7-homebrew` (owner's items 3-6 and answer to Q5, 2026-09-30; planner, passes 2-4).
- Decision: a named source's tag reads «<source> (HB)» as plain text and the default source's
  «Хоумбрю»; a homebrew name inside a relation line (upgrades, made from, set members) reads
  «<name> (HB)»; a homebrew rung on an upgrade ladder, which has no text, takes a dashed border and
  the title «<source> (HB)». From R7c the merged index derives upgrades, made-from, set members and
  ladders over the catalog plus the signed-in account's own records, so a catalog card shows a
  homebrew relation to its author alone; a frozen copy in a list joins `byId` only and adds nothing
  to a catalog card. A craft line with more than three names folds the rest behind «и ещё N» (a
  button with `aria-expanded`); a row draws the first name and the count.
- Rejected: a dashed source badge (the owner chose the text, Q5); a second relation line per
  origin (two labels for one arrow); drawing a viewer's frozen copies on catalog cards (the owner's
  item 6).
