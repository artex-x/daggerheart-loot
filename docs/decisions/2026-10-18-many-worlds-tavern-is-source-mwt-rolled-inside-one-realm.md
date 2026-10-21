# 2026-10-18 - Many Worlds Tavern is source mwt, rolled inside one realm

- Task: `many-worlds-tavern` (owner, 2026-10-18; the art 2026-10-20).
- Decision: the four "Wayward Wonders" card sets are one source, key and table `mwt`, section
  `roll/mwt` (`app/src/lib/realms.ts`, `PickerRollPanel.svelte`): a realm picker, then a roll
  inside that realm's deck, input `mwt {r, n}` in memory. Record field `realm` (`sporopolis`,
  `wagerwood`, `warrens`, `godsvale`, release order); ids `mw1`-`mw81` realm by realm, `roll`
  the card's place in its realm. Realm names: «Спорополис», «Лес Пари», «Воюющие Норы», «Долина
  Богов». The 81 item cards ship with their own art in this batch; the eight domain cards are
  not loot and are not added. Warrin' Warrens counts its 23 printed cards, 21 items.
- Rejected: browse-only, a third "Other" subchip with no roll (a GM rolls for the realm the party
  is in); one flat roll 1-81 (ignores the realms the sets are built around); the art in a later
  `refresh-artwork` task (81 `_none.webp` cards and a second pass over the same goldens); the
  product page's count of 25 Warrin' Warrens cards (every card footer says `/23`).
