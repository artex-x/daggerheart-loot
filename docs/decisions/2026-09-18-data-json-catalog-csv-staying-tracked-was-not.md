# 2026-09-18 - `data.json`/`catalog.csv` staying tracked was not solved by a pretest step

- Task: `untrack-stubs` (retired; recorded here at retirement).
- Decision: `data.json` and `catalog.csv` stay tracked in git (triggers to
  reopen this: `docs/specs/CONTRACTS.md` section 4).
- Rejected: `"pretest": "npm run data"` (fires for `npm run test` but not
  `test:watch`, and makes a plain `npm test` write 1093 files); pointing the
  seven `app/src/lib/*.test.ts` suites at `data.js` instead (changes what
  they prove, voids `COVERAGE.md`'s "the real `data.json`"); `existsSync` +
  `it.skip` (coverage thresholds fail anyway, or the gap is hidden); a
  vitest `globalSetup` builder (the same tree mutation, only hidden).
