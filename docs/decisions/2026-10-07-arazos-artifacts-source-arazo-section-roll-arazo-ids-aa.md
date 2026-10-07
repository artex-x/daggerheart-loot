# 2026-10-07 - Arazo's Artifacts: source arazo, ids aa1-aa51, tier formulas as lines

- Task: `arazos-arifacts`, owner decisions 2026-10-07.
- Decision: source key and table id `arazo`, section `roll/arazo` (a random
  pick over 51 rows, as `roll/dv`), ids `aa1`-`aa51` and `roll` 1-51 in book
  order with an upgrade line's rungs directly after its head. A piece whose
  stats or feature scale with the bearer's tier is a four-tier `eq.line`
  (`Improved`, `Advanced`, `Legendary`; formulas evaluated per tier); a piece
  with no tier formula is an artifact, `eq.tier: 'A'` with record `tier: 'A'`,
  which extends `2026-09-23-artifact-equipment-eq-tier-a-printed-as-a.md`.
  Ordinary items keep "your tier" as text. Art: v2 where the delivery has two
  versions. Lore, discovery and bearer questions are not shipped.
- Rejected: one record per book entry at `'A'` with the formula in the text
  (armour needs numbers in `as` and `th`); the draft's `aaN_tK` ids (the
  `dataint` id rule); a numeric record `tier` on rungs (that field is the
  Vault of Ages section); browse-only with no roll; roll numbers on the 27
  base records only (the owner accepted more rolls on the scaling pieces).
