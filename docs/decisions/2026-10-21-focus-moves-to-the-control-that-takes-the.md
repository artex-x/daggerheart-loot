# 2026-10-21 - Focus moves to the control that takes the place of a removed one

- Task: `debt-cleanup` (owner, 2026-10-01: the focus of a control that removes itself; planner default, 2026-10-16).
- Decision: when a press removes the pressed control, focus moves to the control that now holds its place in the same
  group, else the nearest one before it, else the group's lead control, else `#main` (the shell's main landmark, which
  the skip link already focuses). `FEATURES.md`, rule 20, lists the cases: «Выйти», a filter pill and «Сбросить всё»,
  the `#/lists` deletes, the homebrew bulk delete and move. Each component moves focus after a `tick()`, from the
  elements it holds; `MoveNotice` is left to R10, which removes it.
- Rejected: the page heading with `tabindex="-1"` (a heading becomes a tab stop on no page today, and every golden's
  heading would change); `body` (the defect itself: the next Tab starts from the top and nothing is announced); one
  shared focus helper (each group knows its own controls; three lines per caller, extracted on a real second shape).
