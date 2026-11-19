# 2026-11-19 - The take count steps by one between Min and Max; a tick takes the stock

- Task: `pickqty-usability` (owner, 2026-11-19).
- Decision: «-» and «+» sit inside the take line's joined control between
  «Мин» and «Макс» / "Min" and "Max", and the first count of a ticked
  stacked entry stays the whole stock (`PickQty.svelte`; `FEATURES.md`, "Lists").
- Rejected: a first count of 1 (every batch action reads the count: «Удалить»
  would leave ticked stacks, «В список» and the purchase request would carry one
  piece); a stepper without «Мин» and «Макс» (N-1 presses from the stock to
  one); a long-press repeat (a gesture with no label, The Clarity Rule).
- Supersedes in part "The take count sits between Min and Max in one control; no stepper" (2026-09-30): the no-stepper rule; Min, Max and the field stay.
- Amends "A take line inside the ticked row; the summary names entries and pieces; the shared print and copied prices carry the count" (2026-09-23): the ±1 stepper joins the control.
