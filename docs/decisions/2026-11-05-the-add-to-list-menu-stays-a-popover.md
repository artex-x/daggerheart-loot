# 2026-11-05 - The add-to-list menu stays a popover

- Task: `57` (planner default while the owner was away, 2026-11-05).
- Decision: the add-to-list menu (`AddToList.svelte`) is a popover at every width,
  also at 360 px, measured against the window and its clipping box and never under
  the dock. Its content: the heading «Списки», a neutral row per list
  with a check where it holds the record and its count in words, and «Новый список»
  under a separator (docs/specs/FEATURES.md, "Lists").
- Rejected: a bottom sheet up to 760 px (a `Sheet` nested in the record
  `<dialog>` resets `app.dialogOpen` when it closes and draws a second `Toast
  inDialog`; it needs a dialog depth counter in `app.svelte.ts`, `Sheet`,
  `RecordModal`, `CropDialog` and `Toast`, over four callers of the menu).
- Consequence: at 360 px an action toast covers the end of a menu that opens up for
  its 7 s, as it covers the end of «Ещё»; the owner may ask for the sheet later.
