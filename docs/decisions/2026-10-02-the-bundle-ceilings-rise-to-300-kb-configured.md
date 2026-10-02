# 2026-10-02 - The bundle ceilings rise to 300 kB configured and 250 unconfigured

- Task: `persist-7f-consistency` (owner's answer O-1, 2026-10-02).
- Decision: the per-batch step of `tools/bundle-budget.mjs` stays (a batch
  whose build passes a budget raises it to its measured size plus about
  5 kB, rounded up, in the same commit), and its ceilings rise to 300 kB
  configured and 250 kB unconfigured. Past a ceiling the batch stops and
  asks the owner. Before the rise about 4-6 kB stayed under 190 kB
  unconfigured for R7g and R7d.
- Rejected: a lazy chunk for the homebrew editor (a seam and a loading state
  for one page, and a lazy chunk still counts in the budget); deciding at
  R7d (the refresh before R7d would stop on the ceiling).
- Amends "The bundle budget steps up per batch to 250 kB configured and 190 unconfigured" (2026-09-30): the ceilings.
