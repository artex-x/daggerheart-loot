# 2026-09-22 - A feature that swaps a weapon's stat set gets the Versatile second strip

- Task: `dragons-vault` (human review).
- Decision: `eq.alt` holds any second stat set a weapon's own feature
  switches to, not only Versatile's: Ember's Fan the Flames (Agility, Very
  Close, d12+5 mag) and the Steampowered Gauntlets' Supercharge (Strength,
  Melee, d12+4 phy; the -1 Evasion and the Stress to move stay in the
  text). The print card draws it as the second strip. The text stays as
  the book prints it: `eq.alt` is stored data, nothing parses the text at
  render time. `tests/derived.js` names every non-Versatile record that
  carries one.
- Rejected: rewording Ember as "Versatile" (a paid swap is not a free
  choice, and `Универсальное` stays reserved for Versatile); a render-time
  parser; the Spellblade (its summoned stats are its main stats, above).
