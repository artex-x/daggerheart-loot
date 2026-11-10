# 2026-11-07 - One roll row per item: an upgrade line is rolled at its head

- Task: `roll-per-line` (owner, 2026-11-05 and 2026-11-07).
- Decision: a roll pool holds one row per item. An upgrade line is one item: its head is the only
  rolled record; a rung keeps its row, id and links but has no `roll`. `app/src/lib/roll.ts`
  `rollPool` drops the rungs in `RollPanel`; `tests/dataint.js` pins it. `arazo` rolls 1-27 and `ph`
  1-45 (were 1-78 and 1-93); a roll shows the head (Tier 1), and the other tiers open from the card.
  The result face keeps no ladder (2026-11-04). Rule: `docs/specs/FEATURES.md`, "Rolling".
- Rejected: weights (a line four times as likely is the defect); moving rungs to `L.eq` (`L.eq` is
  `core` and `hnf` only, and the table page loses them); a random tier on a roll (another feature);
  rolls kept on rungs with a `roll != null` filter in code (two sources of truth); a ladder on the
  result face (reverses the 2026-11-04 rule and adds a row to the face).
- Supersedes in part "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines" (2026-10-07): roll numbers on the base records only, rejected there, now hold.
- Supersedes in part "Arazo's Artifacts rebalanced to Core bands: every piece a line, ids aa1-aa78" (2026-10-08): the rolls; the ids stay.
- Supersedes in part "Pistolheart, The Last Round Table and Veiled Halls are sources ph, lr and vh" (2026-11-07): ph ids are no longer equal to the rolls.
