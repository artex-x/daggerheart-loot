# 2026-09-24 - The print card frame follows the weapon's class

- Task: `debt-cleanup`; the owner asked for it.
- Decision: `PrintCard.svelte` picks the stat strip's ribbon (`ribbon` or
  `ribbon-mag`) and die art (`die-N-phy|mag`) from the weapon's class,
  `eq.cls === 'mag'`, on both strips of a two-strip weapon; the damage box
  still names each strip's own damage type.
- Reason: the frame tells a player the weapon needs Spellcast, as the class
  tag does, and a frame keyed on the damage type contradicted that tag.
- Rejected: the damage type (a magic weapon dealing `any` damage printed a
  physical frame, a physical one dealing magic damage the reverse); a
  per-strip class for `alt` (the second strip is the same weapon).
- Cards changed: q33, q94, q142, q162, q229 become magic; dve38, dve39
  become physical; q171's second strip becomes magic.
