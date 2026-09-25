# 2026-09-22 - The shared page's top control saves a copy; the selection bar alone adds to a list

- Task: `58`.
- Decision: the shared list page's top control is a plain gold "Сохранить
  себе" / "Save to my lists" button, no caret, always drawn whatever the
  selection. One press creates a new own list from the whole shared list -
  ids, both notes, entry meta and money mode - and opens it. Pouring the
  list into an existing list stays possible as select-all plus the
  selection bar's "Добавить в список" chip, now the only add-to-list menu.
- Rejected: relabelling the menu "Сохранить список" / "Save list", caret
  kept - two gold caret buttons with near-identical menus still read alike;
  hiding the top control while a selection exists - it would jump under the
  reader's thumb and keep the bar's own label while shown. Labels
  "Сохранить копию" / "Save a copy" - the bar already holds "Скопировать"; and
  "Клонировать список" / "Clone list" - developer jargon in Russian UI.
- Evidence: issue 58's screenshot, two identical gold "+ Добавить в список"
  buttons on screen at once with rows ticked.
