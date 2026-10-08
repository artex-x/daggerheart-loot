# 2026-10-08 - Arazo's Artifacts rebalanced to Core bands: every piece a line, ids aa1-aa78

- Task: `arazo-rebalance` (owner, 2026-10-08).
- Decision: the 17 pieces of equipment are four-tier `eq.line`s; the nine fixed artifacts gain
  `Improved`, `Advanced` and `Legendary` rungs with the same feature text, and no record keeps
  `tier: 'A'`. Flat damage bonuses and armour thresholds follow the Core sibling bands
  (`tests/derived.js` pins every number); this departs from the printed book on purpose. Dice
  stay, except Ogre-teeth Club (d20 to d12+1/+3/+5/+7). Also changed: Shield of Arcturus
  Protective +2/+2/+3/+4, Flight of the Phoenix attack +1/+1/+2/+2 with damage +1/+2/+3/+4,
  Drakebow On Fire on an attack roll.
- Decision: ids and rolls renumber to `aa1`-`aa78` in book order, a line's rungs directly
  after its head; each head's art moves byte for byte to the head's new id, rungs reuse it.
- Rejected: appending the 27 new rungs as `aa52`-`aa78` (breaks "rungs directly after the
  head" for ids and rolls; renumbering is safe while no user has saved an `arazo` item);
  keeping the old asset names under new ids (an asset name would point at another record).
- Supersedes in part "Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines" (2026-10-07): ids, rolls and the artifact rule.
