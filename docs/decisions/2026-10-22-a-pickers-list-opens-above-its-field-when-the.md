# 2026-10-22 - A picker's list opens above its field when the visible window has more room

- Task: `persist-review` (owner, decision 51: P20 "Implement, gated by capture", 2026-10-22; planner, 2026-10-22).
- Decision: `ItemPicker` opens its list under the field, or above it when the list does not
  fit under it and the visual viewport below the sticky `.topbar` (and above the on-screen
  keyboard) has more room above, with an inline `max-height` of that room, measured from the
  downward side, as `AddToList` measures its menu; a resize, a visual viewport pan and a page
  scroll place the open list again. Behaviour: `docs/specs/FEATURES.md`, "Homebrew".
- Rejected: the list in the page flow (the keyboard still covers it); a `scrollIntoView` of the
  list (the field goes under the sticky top bar).
- Evidence: at 360x480 with the field at the window's bottom, 236 of the list's 240 px were
  under the window, and 26 px with the field in the middle (the test build, 2026-10-22).
