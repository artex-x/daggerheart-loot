# 2026-10-15 - A timed component case leaves axe to its sibling test

- Task: `debt-cleanup` (planner default, 2026-10-15).
- Decision: a `timed` component case (`*.timed.test.ts`) measures its bound and ends without
  `expectNoA11yViolations`; the axe of the state it draws runs in its sibling component test at
  a small count. `homebrewPage.timed.test.ts` keeps its seed of 400 member links, the 3000 ms
  draw bound and the order check; the open fold's axe stays in `homebrewPage.test.ts`, "lists
  own and book members by name, a gone id by its own words, and counts both", whose own, book
  and gone rows reach every rule that 400 rows reach. `listPage.timed.test.ts` and
  `importPanel.timed.test.ts` already end so.
- Why: axe over the 400 rows was 41.0 s of the file's 52-56 s (2026-10-15, this host).
- Rejected: a rule subset (it changes what axe proves for every rule); axe over a sample of the
  rows (an axe context argument for one caller); keeping 52-56 s per coverage run; a split of
  the file (it moves the cost and does not cut it).
- Accepted trade-off: axe no longer reads 400 rows at once.
