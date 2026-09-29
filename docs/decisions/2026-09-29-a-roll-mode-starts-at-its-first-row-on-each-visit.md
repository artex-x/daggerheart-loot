# 2026-09-29 - A roll mode starts at its first row on each visit; no number crosses tabs

- Task: `persist-4b-requests-polish` (planner, 2026-09-29, on the owner's bug report; the owner waived the review).
- Decision: Wondrous, Dread and The Dragon's Vault share one branch of
  `App.svelte`; the `RollPanel` there is keyed on the section, so each
  visit starts at row 1, as the other four modes already do
  (`FEATURES.md`, "Rolling").
- Rejected: per-mode memory across visits (the live app kept `S.wond.n`
  and `S.dread.n`; it would change all seven modes); clamping the kept
  number to the new range (a number nobody typed on this table).
- Accepted trade-off: a number is not remembered across a tab switch.
