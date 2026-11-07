# 2026-11-05 - app/states runs as four interleaved rows; the browser job keeps 30 minutes

- Task: `57` (planner, 2026-11-05, after CI run 42102518161 cancelled `browser (3)` twice at 30 minutes).
- Decision: `tests/app/states.js --shard=n/of` runs case `i` of `CASES` when `i % of` is `n - 1`
  (`tests/app/shard.js` is the one parse of `--shard=` for `run-all.js`, `golden.js` and
  `states.js`), and `tests/run-all.js` `SUITES` holds four `app/states` rows, one per piece.
  Inside a shard the rows run four at a time, so a shard lasts as long as its longest row.
  Raise `of` to 5 when one `app/states` row passes 600 s on CI. `ci.yml` keeps
  `timeout-minutes: 30` and five shards.
- Rejected: a 45-minute job timeout (every push waits about 31 min, and the row grows about
  57 s per layout case); a sixth shard (no gain while `app/sweep` 768 is the 839 s floor, and
  it edits `ci-credit.mjs`); a split by case ranges (the slow layout cases sit at the end of
  the list, so most would land in the last piece).
- Evidence: one `app/states` row took 1742.8 s at 97 cases in run 42083009049, against about
  1730 s of step time in a 30-minute job.
