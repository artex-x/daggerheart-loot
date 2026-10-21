# 2026-10-18 - Many Worlds Tavern equipment keeps its printed stats

- Task: `many-worlds-tavern` (owner, 2026-10-18).
- Decision: the 26 weapons and armor (16 primary, 6 secondary, 4 armor) carry their printed tier,
  damage and thresholds, one record per card and no `eq.line`; they live in `items.mwt` with an
  `eq` block and appear in the equipment tables too. Rottooth Dagger (mw6) prints no slot and is
  a primary weapon.
- Rejected: re-banding to the Core damage and threshold bands, as Arazo's Artifacts was (it
  changes the numbers each card prints beside its tier).
