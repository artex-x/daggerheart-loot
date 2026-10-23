# 2026-10-22 - The unconfigured bundle ceiling rises to 270 kB

- Task: `persist-review` (the owner, 2026-10-22: "we can increase it up to 270
  defensively").
- Decision: the unconfigured ceiling of `tools/bundle-budget.mjs` is 270 kB and the
  configured one stays 350 kB. A batch whose total passes a budget raises it to its
  measured total rounded up to the next whole kB, in the same commit; past a ceiling
  it stops and asks the owner. Measured 2026-10-22: 250.3 and 308.1 kB, budgets 251
  and 309.
- Rejected: the budget set at the ceiling at once (it hides a growth until 270); the
  measured size plus 5 kB (it hides 5 kB per batch); a bundle split to stay under
  250 (a seam and a loading state for no reader's gain).
- Consequence: every later batch that grows the code measures and raises again.
- Amends "The bundle ceilings rise to 300 kB configured and 250 unconfigured" (2026-10-02): the unconfigured ceiling is 270 kB.
- Amends "The configured bundle ceiling rises to 350 kB" (2026-10-14): a passed budget rises to the measured total rounded up to the next whole kB, not plus about 5 kB.
