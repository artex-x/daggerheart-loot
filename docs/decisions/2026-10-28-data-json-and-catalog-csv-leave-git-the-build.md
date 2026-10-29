# 2026-10-28 - `data.json` and `catalog.csv` leave git; the build writes both

- Task: `repo-assets` (owner, 2026-10-28, Q1 option B).
- Decision: `data.json` and `catalog.csv` are build output like `names.json`:
  gitignored, written by `node tools/build.js`, published by the deploy at
  the same URLs. Vitest reads the catalog from `data.js` through
  `app/src/test/loot.ts`; the files are only `dataJson` and `catalogCsv` of
  it, so the 2026-09-18 rejection of that reader no longer holds. CI's
  stale-commit step goes: nothing generated from `data.js` is committed.
- Rejected: `data.json` out and `catalog.csv` kept as the readable diff of
  the one-line `data.js` (the planner's recommendation; the owner chose
  both out); both kept (generated files in git); a vitest `globalSetup` or
  a `pretest` that writes the files (a hidden write every runner needs).
- Accepted trade-off: a data change has no readable diff in git, and a
  reader of either file's GitHub copy loses it.
- Supersedes "`data.json`/`catalog.csv` staying tracked was not solved by a
  pretest step" (2026-09-18).
