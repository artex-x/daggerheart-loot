# 2026-10-14 - The configured bundle ceiling rises to 350 kB

- Amended by "The unconfigured bundle ceiling rises to 270 kB" (2026-10-22): a passed budget rises to the measured total rounded up to the next whole kB, not plus about 5 kB.
- Task: `print-snapshots` (the owner's decision, 2026-10-14).
- Decision: the configured ceiling of `tools/bundle-budget.mjs` rises from 300 kB to
  350 kB; the unconfigured ceiling stays 250 kB, and the rule is unchanged: a batch
  whose build passes its budget raises it to its measured size plus about 5 kB, never
  past the ceiling, and past a ceiling it stops and asks the owner.
- Rejected: keeping 300 kB (it left `debt-cleanup` and R10 about 8 kB after this
  task, and D60's 1.5 kB is the only recorded saving; `docs/specs/DEBT.md`
  D60 is in `git show dbcad73a^:docs/specs/DEBT.md`, paid in `dbcad73a`).
- Amends "The bundle ceilings rise to 300 kB configured and 250 unconfigured" (2026-10-02): the configured ceiling is 350 kB.
