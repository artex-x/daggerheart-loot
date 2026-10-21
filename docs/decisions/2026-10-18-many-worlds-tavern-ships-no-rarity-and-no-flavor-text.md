# 2026-10-18 - Many Worlds Tavern ships no rarity and no flavor text

- Task: `many-worlds-tavern` (owner, 2026-10-18).
- Decision: the rarity printed on the 55 loot and consumable cards and the cards' flavor text
  are not shipped: no field, chip, filter or text line; the task's transcript kept them. Chef's
  Incredible Sack (mw51) keeps its printed "random common/uncommon/rare consumable", which
  Core's rarity rule resolves. mw76 keeps `TR-U57-Y` in Latin in Russian (`I18N.md`, "Rules").
- Rejected: a record field `rar` with a chip and a filter (no other record carries a rarity;
  rarity exists only as the alternate tables' layout); a labelled first line `***Rarity:***`
  in the text; flavor as a last text line (Arazo's GM notes set the precedent).
