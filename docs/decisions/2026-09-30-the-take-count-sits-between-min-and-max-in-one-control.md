# 2026-09-30 - The take count sits between Min and Max in one control; no stepper

- Task: `persist-4b-requests-polish` (planner, 2026-09-29; revised on the owner's mock review and the owner's «Мин»/«Макс» naming, 2026-09-30).
- Decision: the take line's count field sits between «Мин» and «Макс» /
  "Min" and "Max" in one joined control, `NumberField`'s `.numbox` shape:
  «Мин» sets the count to 1, «Макс» to the whole quantity, each disabled
  at its end, each end at least 44 px wide at phone width
  (`PickQty.svelte`; `FEATURES.md`, "Lists").
- Rejected: two buttons at the end of the line, after the sum (the owner:
  detached from the count); «1» and «Все» on the ends (the owner: too many
  numbers on one line); a ±1 stepper (N-1 presses from the stock to one);
  a `<select>` of 1..N (up to 99 options).
- Amends "A take line inside the ticked row; the summary names entries and pieces; the shared print and copied prices carry the count" (2026-09-23): a joined control around the field holds the ends; the ±1 stepper stays rejected.
