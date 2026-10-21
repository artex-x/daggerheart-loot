# 2026-10-21 - The editor draws the print card at the preview column's width

- Task: `debt-cleanup` (owner report, 2026-10-18: the preview is too small at 1920 px; planner design, 2026-10-20).
- Decision: the item editor's preview column is 340 px from 800 px and 420 px from 1100 px; «На печати» draws the
  print card at the column's width, at most 420 px: a scale (`previewScale`, cut to two decimals so the cell never
  passes the column) sizes the cell (`calc(63mm * scale)`) and `PrintCard`'s `scale` prop multiplies every `mm` and `pt`
  value of its stylesheet (`--pc-scale`); `fit()` reads its paper floors through the same scale. The rest is `cqw`, so
  the fit and the clip verdict equal the print page's (`tests/app/print.js` compares them). The print page draws scale 1.
- Rejected: a transform or `zoom` (`fit()` compares layout sizes with rendered ones); the printed size (the owner's
  report); `cqw` floors in place of `pt` (they change the print page's own values); rounding the scale to the nearest
  hundredth (a 328 px column took a 328.6 px card).
- Supersedes in part "The editor previews the print with the print card at its printed size" (2026-10-15): the size.
