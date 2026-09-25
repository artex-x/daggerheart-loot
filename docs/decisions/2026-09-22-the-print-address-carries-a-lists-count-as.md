# 2026-09-22 - The print address carries a list's count as `*<n>` per id

- Task: `67`, human decision (find it with `git log --grep="Task: 67"`).
- Decision: `#/print/<id>[*<n>]-...`. A count over 1 is drawn after the
  card's name as ` ×N`, clamped to 99; anything else draws no counter. `*<n>`
  is the list link's own `id*qty` spelling, so one spelling means "quantity"
  in both public formats. Only the list page's print button writes it
  (amended 2026-09-23: the shared page's selection bar writes the taken
  counts too).
- Rejected: the count from memory (the open list) - lost on reload and on
  the copied set link, against `ROUTES.md`'s reason for reading print from
  the address; a repeated id as a count (`ci1-ci1-ci1`) - changes addresses
  already shared, where a repeat is dropped, and 99 is 99 ids; `.` as the
  separator (`ci1.3`) - a second spelling for "quantity"; `x` or `_` - ids
  already hold both; a list-payload print route - a second print grammar for
  one number per card; N printed copies - not what the issue asks for.
- Accepted trade-off: whether a chat client mangles `*` in a pasted URL
  (emphasis, or `%2A`) is unmeasured; such an address falls to the home
  section, as any unreadable address does. The card name cap became three
  lines, not a shrink step: Russian names already print at three.
