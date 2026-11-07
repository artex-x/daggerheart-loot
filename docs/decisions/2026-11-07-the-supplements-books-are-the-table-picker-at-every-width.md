# 2026-11-07 - The supplements' books are the table picker at every width

- Task: `new-items` (the owner was away; the orchestrator took the recommended option, 2026-11-07).
- Decision: from 761 px the tables page's supplements group draws one lit tab, the table
  picker's button, which names the open book and opens the picker's sheet, the same sheet as
  below 761 px (`TableNav.svelte`). The other groups keep their tabs, and the tab slot
  reserves one tab row again (docs/specs/FEATURES.md, "Tables and search").
- Rejected: shorter tab captions (the source names follow the product,
  `2026-10-21-source-names-follow-the-source-product.md`); two lines of tabs with a relaxed
  First-Screen Rule (a design law bent for one group); a «и ещё N» fold of the tabs (its open
  state still takes a second line).
- Evidence: ten tabs need 1331 px for one line; from 761 to about 1380 px they took two
  lines on every table, the rows started at 331 px at 1000x720 (rule 288 px) and the head was
  130 px at 1180 px (cap 110 px).
- Accepted trade-off: on a desktop another supplement is two presses away (the picker, then
  the book), not one.
