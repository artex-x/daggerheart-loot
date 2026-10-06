# 2026-10-08 - The own-items filter is a labelled switch, «Свои предметы»

- Task: `persist-7h-homebrew-page` (owner, 2026-10-02, answer 5; the label "Own items" accepted 2026-10-07; planner).
- Decision: the memory-only filter that hides the own items on `#/search` and in the equipment tables' toolbar is the switch «Свои предметы» / "Own items" (`components/Switch.svelte`: a native checkbox with `role="switch"` inside its label, the gold focus ring), on by default, drawn only while the account holds an item. On `#/search` it sits under the kind row, apart from the filter chips; the kind row holds the three kinds, and «Нужен хотя бы один тип» applies to them only.
- Rejected: the chip «Хоумбрю» in the kind row (with it on, unpressing the last kind was refused «Нужен хотя бы один тип», which read as a bug); a chip apart from the kind row (it reads as one more filter value); the label "My items" ("My items" names the page «Мои предметы»).
- Supersedes in part "Homebrew is first-class in the catalog pages; the roll pages are excluded" (2026-09-30): the chip «Хоумбрю» on `#/search` and the equipment tables becomes the switch «Свои предметы».
- Accepted trade-off: the visible control is a styled sibling of a visually hidden input; the English label differs from the 2026-10-02 mock.
