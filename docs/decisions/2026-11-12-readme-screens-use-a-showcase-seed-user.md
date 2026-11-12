# 2026-11-12 - README screenshots use a showcase seed user and are captured by hand

- Task: `readme-screens` (owner, 2026-11-07, the recommended answer to each question).
- Decision: the account screens of the README images sign in as a fifth seed user, `gm5`, which
  holds one list of 8 entries (prices from 5 to 300 gold) with a players' link and one homebrew
  source with three items that carry catalog pictures. `npm run screens` captures the eight images;
  CI does not capture and only runs `tools/screens.lib.test.mjs` (references, parity, budgets).
- Rejected: edit `gm1`'s data (it breaks the `docs/fixtures/homebrew-file/export.json` parity,
  many unit tests and the `as gm1` goldens, and its 99999 entry tests a wide price); write the
  data at run time through `window.__dhlootFake` (it couples a tool to the fake's internal API);
  capture in CI (Linux and Windows render fonts differently, so every file would change on each run).
- Trade-off: the test build carries one more user that no suite opens except one seed-shape test,
  and a stale image is found by a person, not by a check.
