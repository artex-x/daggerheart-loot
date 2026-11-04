# 2026-11-04 - The roll pages share one layout, and a result is a card face with its own row

- Amended by "A roll result is the tall face only when the roll fits one line" (2026-11-04): a roll that does not fit one line draws row faces.
- Task: `57` (the owner's mock 5 and its reviews, 2026-10-29; the AFK defaults of the batch 5 refresh).
- Decision: the nine roll pages draw `RollPage`: up to 760 px a read-only `h1`, the controls, one results line with «Настроить» and «Ещё»; from 761 px two panes. A result is `RecordCard variant="face"` with `RollResult`'s row under the plate. The pin, the help and the copy of every option are items of «Ещё» up to 760 px. A choice among parts is a native select.
- Rejected: the mock's hidden duplicate DOM (every id twice); a restyled `compact` (it reshapes the list page in another batch); a custom listbox for the pickers; dropping the «ИЛИ» separators (nothing else says the cards are alternatives); a «Все» chip over the source and type toggles (it changes the model and the last-source rule); a lit die (a roll button is not a choice).
- Accepted trade-off: the open select is the browser's own list; `/roll/std` at 360 is 325 px to its first result (the owner's named exception); the results have no «Печать».
