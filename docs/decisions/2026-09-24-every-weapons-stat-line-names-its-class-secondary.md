# 2026-09-24 - Every weapon's stat line names its class, secondary weapons too

- Task: `debt-cleanup`; the owner reversed the entry above.
- Decision: `eqParts` (`app/src/lib/i18n.ts`) and the share stub's `eqLine`
  (`tools/build-share-pages.js`) print the class on every weapon, never
  inferred from the damage type; the `eq_secondary` filter row that filters
  the class is labelled «Класс»/"Class", as on primary weapons.
- Reason: a character without a Spellcast trait cannot equip a magic weapon,
  so a secondary's class must be as explicit as a primary's; Hope & Fear has
  14 magic secondaries.
- Rejected: the damage type standing in for the class (the entry above);
  dropping the class tag from secondary print cards.
- Cost: 123 records' copied text and table rows, 246 stub `og:description`s
  refreshed by `previews.yml`, and the goldens that draw a secondary's row.
- Supersedes "A secondary weapon's stat line names its damage type, not its class" (2026-09-24).
