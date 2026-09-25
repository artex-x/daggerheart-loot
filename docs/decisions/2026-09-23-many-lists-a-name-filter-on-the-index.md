# 2026-09-23 - Many lists: a name filter on the index, a pinned search and create control in the menu

- Task: `68`. Design target 200 lists; nothing may break before the quota.
- Decision: from the eighth list (`LIST_SEARCH_AT`, the menu's own
  threshold) the index draws a name filter, folded as search folds
  (`foldQuery`), memory only; a create clears it; no match draws «Ничего не
  найдено». Cards, their order and their actions stay. The add-to-list menu
  scrolls its chips only: the label, the search and «+ Новый список» stay in
  view. The menu's search folds the same way, and the new-list form starts
  with the typed query as its name.
- Evidence (2026-09-23): at 50 lists the index is 3447 px at 1100 wide and
  9096 px at 375; «+ Новый список» sits 2209 px down a 338 px menu, and
  already 412 px down at 8 lists.
- Rejected: a new filter string (`findList` reads «Найти список»); a
  shown-of-total count (a second `.fcount`; the cards are the answer); the
  menu's search taking focus on open (a phone's keyboard covers the chips).
- The owner's answers on paging and menu order: the next entry.
