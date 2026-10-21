# 2026-10-21 - Unnumbered Many Worlds Tavern realms order by kind, then name

- Task: `mwt-drome` (owner, 2026-10-21: Q1, Q3; realm order by release date).
- Decision: Hornet Hold (`hornet`, «Оплот Шершней», February 2026) and The Drome (`drome`,
  «Дром», March 2026) are the fifth and sixth realms of `mwt` (`app/src/lib/realms.ts`). Their
  cards print no number, so ids `mw82`-`mw92` and `mw93`-`mw109` and `roll` run weapons, armor,
  loot, then consumables, each by English name with a leading "The" ignored. 11 and 17 cards
  are not a die, so the button picks at random, as for Warrin' Warrens.
- Rejected: the file order on disk (it mixes kinds); the product page order for The Drome (it
  lists none); The Drome first (released after Hornet Hold); the item footers' "Hornet's Hold"
  (the product and its siblings say "Hornet Hold").
