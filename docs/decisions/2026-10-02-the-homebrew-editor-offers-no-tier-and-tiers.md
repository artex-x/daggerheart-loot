# 2026-10-02 - The homebrew editor offers no tier and tiers 1-4; a stored A or C tier stays

- Task: `persist-7f-consistency` (owner's editor feedback of 2026-10-02; equipment kept at 1-4, required, while the owner was away).
- Decision: loot and consumables offer «Без ранга» and 1-4, equipment 1-4
  (required). «Артефакт» ('A') and «Проклятый предмет» ('C') are Vault of
  Ages categories: a new item cannot take them; an item stored with one
  shows it after 4, pressed, until a saved change of the tier drops it. The
  validator, the store, the database and the file import keep accepting
  both (`docs/specs/FEATURES.md`, "Homebrew").
- Rejected: keep 'A' and 'C' as choices (owner: Vault of Ages categories,
  not a homebrew tier); reset a stored 'A' or 'C' to «Без ранга» on load (it
  changes stored data on the next save); «Без ранга» for equipment too (the
  equipment tables group by tier and would need a tierless group).
