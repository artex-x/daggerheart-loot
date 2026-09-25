# 2026-09-23 - The compact sheet is an independent size switch for both print layouts, kept in session memory

- Task: `61`, human decision (find it with `git log --grep="Task: 61"`).
- Decision: a second print switch, `Обычная` / `Компактная`, beside the
  colour switch: sixteen 44x63 mm cards per A4 sheet in either layout,
  `pages(items, 16)`, the same card at 70% (every dimension is `cqw`).
  `AppState.printCompact` is session memory beside `printBW` (D21). The
  address, the contracts and `printHint` are unchanged.
- Rejected: compact black-and-white only - a 44 mm colour card prints 4.3 pt
  rules text (3.2 pt at the floor) and hides its picture on the longest
  texts; the owner's answer: a reader who does not want compact colour does
  not select it. A single three-option switch - it forced compact to one
  layout. `localStorage` - reverses D21 for one field; both choices would
  move into `dhloot.prefs.v1` together. The URL - `#/print/<ids>` is frozen,
  and the size is the printer's fact.
- Accepted trade-off: compact colour text is 4.3 pt; the longest
  black-and-white texts read at 4.2-4.6 pt; both choices reset on reload.
