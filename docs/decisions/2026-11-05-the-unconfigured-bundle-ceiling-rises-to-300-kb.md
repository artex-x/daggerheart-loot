# 2026-11-05 - The unconfigured bundle ceiling rises to 300 kB

- Task: `57` (the owner, 2026-11-04, chat: "we can increase budget up to 300").
- Decision: the unconfigured ceiling of `tools/bundle-budget.mjs` is 300 kB and the
  configured one stays 350 kB. The budgets themselves still rise only by the standing
  rule: a batch whose total passes a budget raises it to its measured total rounded up
  to the next whole kB, in the same commit; past a ceiling it stops and asks the owner.
  Measured 2026-11-05 at task 57 batch 8: 268.3 and 325.7 kB, budgets 269 and 326.
- Rejected: the budget set at the ceiling at once (it hides a growth of 31 kB); a
  bundle split to stay under 270 (a seam and a loading state for no reader's gain).
- Consequence: later batches measure and raise by the standing rule up to 300 kB.
- Amends "The unconfigured bundle ceiling rises to 270 kB" (2026-10-22): the unconfigured ceiling is 300 kB.
