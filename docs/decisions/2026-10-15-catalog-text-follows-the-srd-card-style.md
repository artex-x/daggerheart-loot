# 2026-10-15 - Catalog text follows the SRD card style for names, costs and conditions

- Task: `rich-descriptions` (owner, 2026-10-14: answers Q10, Q11, Q13 and Q14).
- Decision: every catalog record, set bonus and rule card text writes a
  feature or property name `***Name:***`, a cost the user pays by choice for
  an effect in bold, and a condition (core, or one a feature defines, from an
  allowlist) in italics; dice, rolls, ranges and numbers stay plain.
  `tools/desc-style.mjs` computes the style from the plain text, with each
  exception an override with its reason, and `tests/dataint.js` holds it. The
  rules: `docs/specs/FEATURES.md`, "Records", "Catalog style".
- Rejected: `*Name:*` in italics, as the label rule drew it (it reads like a
  condition, and the SRD cards use bold italics); bold costs in the rule cards
  only (the owner's example is loot); bold dice and Spellcast Rolls, as the SRD
  cards print them (about 200 spans per language of noise in loot text); core
  conditions only (the SRD italicises the conditions a feature defines); the
  plain costs of the SRD loot tables and the daggerheart.su item pages.
- Amends "Descriptions use a line-based Markdown subset parsed by one module" (2026-10-15): the label form is `***Name:***`.
