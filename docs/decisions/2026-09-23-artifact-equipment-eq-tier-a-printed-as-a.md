# 2026-09-23 - Artifact equipment: `eq.tier: 'A'`, printed as a loot artifact card

- Task: `voa4` (print card: human decision, Q3 option 2).
- Decision: Oath of Balance (`voa4_a3`) is printed in the book's Artifacts
  section, so `Equip.tier` is `Tier | 'A'`: the stat line reads `Артефакт`
  where the rank goes, the equipment tables draw an `Артефакты` section
  after tier 4, the tier facet offers `A` only where a record answers it,
  and the price guess uses the legendary item band. The print card is the
  loot artifact card: the artifact tag, the class tag, no tier band, the
  damage strip. `dataint` allows `'A'` only on a record of that section.
- Rejected: `eq.tier: 4` (an inferred tier, against the product law); the
  stats in the text (hidden from tables, filters and the strip); an
  optional `eq.tier` with `it.tier` fallbacks in every reader; a tier band
  `A` on the print card (a new caption to measure for one card).
