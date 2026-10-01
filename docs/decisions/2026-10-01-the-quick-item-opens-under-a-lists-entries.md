# 2026-10-01 - The quick item opens under a list's entries; its toast links the editor

- Task: `persist-7e-list-quick-item` (owner's mock review, 2026-10-01).
- Decision: «Свой предмет» is a dashed row after a list's last entry, not a toggle among the list
  actions; it opens the panel under itself, so a new entry lands right above it. The success toast
  carries «Изменить», a link that opens the item's editor in a new tab; it lasts 7000 ms, pauses
  while hovered or while the person has moved focus into it, and never takes focus, so focus stays in «Название» for the next item.
- Rejected: the row above the first entry (a new entry lands at the end, out of view on a long
  list); a line under the panel's buttons that links the last item instead of the toast (the owner
  chose the toast for consistency with the current design).
- Amends "A list page makes a plain homebrew item in one press, with no draft mark" (2026-09-30): the toggle's place and the toast's link.
