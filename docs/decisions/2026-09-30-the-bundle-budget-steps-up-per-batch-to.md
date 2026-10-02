# 2026-09-30 - The bundle budget steps up per batch to 250 kB configured and 190 unconfigured

- Amended by "The bundle ceilings rise to 300 kB configured and 250 unconfigured" (2026-10-02): the ceilings.
- Task: `persist-7-homebrew` (owner's answer to Q14, 2026-09-30; written with R7's pages and editor).
- Decision: during the homebrew releases (R7-R7d) a batch whose build passes
  a budget in `tools/bundle-budget.mjs` raises that budget to its measured
  size plus about 5 kB, rounded up, in the same commit, never past 250 kB
  configured and 190 kB unconfigured. Past a ceiling the batch stops and
  asks the owner. With R7's pages and editor the build measured 220.8 kB
  configured and 162.0 kB unconfigured on 2026-09-30, and the budgets
  became 226 and 167.
- Rejected: B, homebrew kept out of the unconfigured build (an import seam
  for a build nobody deploys); C, the slimmer account client first
  (`docs/specs/DEBT.md` D60 buys one batch and delays R7).
- Amends "The configured bundle budget is 210 kB; the unconfigured stays 150 kB" (2026-09-30): the ceilings, and a raise per batch in the same commit.
