# 2026-09-19 - Frostwyrd is a two-step craft chain; every upgrade line stays at four tiers

- Task: `dragons-vault` (was a three-rung `eq.line` until 2026-09-22).
- Decision: `craft: 'dve25'` on Dormant and `craft: 'dve26'` on Awakened,
  no `line`; the card reads "Upgrades to" / "Made from" and keeps the
  "Unique" badge. Each rung keeps the lower rungs' features in its own text
  (the book: a rung retains them), so a copied rung's "Upgrades to" block
  carries only the target's lines the rung lacks. `craft` means "upgrades
  to", so a chain of named items fits it; `line` stays the four-tier
  ladder, and `tests/dataint.js` keeps every line at tiers `1,2,3,4` (58).
- Rejected: a three-rung `line` with a relaxed invariant (it cost the
  "Unique" badge); the draft's `upgrade_line` field (nothing renders it);
  three unlinked one-offs (the book prints one weapon that "improves to a
  new tier"); the target's full text in a copy (repeats two of three
  lines); a "Made from" block in a copy (a copy is for players, forward only).
