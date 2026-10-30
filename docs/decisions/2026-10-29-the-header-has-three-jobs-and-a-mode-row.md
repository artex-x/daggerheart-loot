# 2026-10-29 - The header has three jobs and a mode row

- Task: `57` (owner, 2026-10-23: direction R, the mode row of three controls; 2026-10-29: R7, «Бросок» opens the start section).
- Decision: the header draws three jobs with icons, «Бросок» / "Roll", «Таблицы» / "Tables" and
  «Поиск» / "Search" (`TabBar.svelte`, `app/src/lib/nav.ts`). «Бросок» is lit on the nine roll
  sections and opens the tab's last roll section, else a pinned roll section, else `#/roll/std`.
  The nine roll sections draw a mode row under the sticky header (`ModeRow.svelte`): Core rules,
  the alternate tables and one «Дополнения ▾» menu of the seven supplements, whose button shows
  the open supplement's name. `routes.json` pins the lit job and the lit mode of each route.
- Rejected: five tabs with a chip panel on each supplement page (two presses and a 206 px panel at
  360, a tab whose name is not a page); one row of nine chips (two rows at 1180); one scrolling
  row of nine with an edge fade (hidden modes change with width and language); B2's rail and
  bottom bar (a second navigation model on the phone).
- Accepted trade-off: a switch between two supplements takes one more tap (open the menu).
- Supersedes "Supplement roll sections share one tab and a chip panel" (2026-10-20).
