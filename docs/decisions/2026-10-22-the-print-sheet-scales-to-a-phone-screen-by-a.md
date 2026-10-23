# 2026-10-22 - The print sheet scales to a phone screen by a transform the fit divides out

- Task: `persist-review` (the owner, decision 51: I5 "Implement now", 2026-10-22;
  planner, 2026-10-22).
- Decision: below about 840 px `#/p/` draws its sheets with `transform: scale()` under
  `@media screen` at `sheetScale` (the column's width over 210 mm, cut to three
  decimals), and `PrintCard`'s `screenScale` divides the same number out of the
  rendered sizes that `fit()` reads, snapped to 1/64 px. The fit and the printed sheet
  equal a wide window's; print media draws no transform.
- Rejected: the editor's re-layout at `--pc-scale` (the sheet prints from the DOM it
  draws, and a fit at another size differs by up to 0.1cqw); `zoom` (it changes the
  layout, so the fit); a re-fit at `beforeprint` (a phone browser can print without the
  event, and 180 cards fit at once); a hidden full-size copy for print (twice the cards
  and the fits); the sideways scroll (the owner's I5).
- Consequence: the editor's card is re-laid out and the sheet is transformed, because
  the sheet prints from what it draws. The 1/64 px snap is the Blink and WebKit unit;
  Gecko's 1/60 px can move a Firefox re-fit by one 0.1cqw step at a near-tie.
