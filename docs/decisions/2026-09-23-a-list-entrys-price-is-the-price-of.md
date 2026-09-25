# 2026-09-23 - A list entry's price is the price of one unit; a selection's total is summed in coins

- Task: `50` (find it with `git log --grep="Task: 50"`).
- Decision: `gold` on a list entry is what one unit costs. A selection's total
  is the sum of `gold x taken count` over the ticked, priced entries, in whole
  coins, read once through `priceText` in the list's own money mode - so the
  rounding to two units applies to the total, never line by line. An unpriced
  ticked entry adds nothing and is counted aloud: "Итого: 1 мешок 1 горсть
  (без цены: 1)". With no priced entry ticked, no total is drawn.
- Rejected: `gold` as the price of the whole stack - the price guess
  (`guessPrice`) and the percentage shift already treat it as one record's
  price; summing only the priced rows with no word about the rest - reads as
  a complete total when it is not; no total while any row is unpriced -
  useless for a shop that prices part of its stock; rounding each line
  before summing - the sum of rounded lines drifts from the real price.
