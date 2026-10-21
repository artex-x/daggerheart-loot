# 2026-10-20 - Supplement roll sections share one tab and a chip panel

- Task: `many-worlds-tavern` (owner, 2026-10-20: option B and the label).
- Decision: the header draws Core rules, the alternate tables, «Дополнения» / "Supplements",
  Tables, Lists, Search (`TabBar.svelte`). «Дополнения» links to `#/roll/wondrous`, is lit on the
  six supplement sections (`app/src/lib/nav.ts`), and their pages draw a chip panel of all six
  (`SupplementNav.svelte`). The tables page groups the books under one chip (`TABLE_NAV`); the
  record path words (`TABLE_GROUPS`, `whereFrom`) do not move.
- Rejected: one «Бросок» tab over every roll mode (hides the alternate tables, a 206 px panel on
  Core rules at 360); a «Ещё» menu (the hidden tab changes with the width and the language, and
  needs a runtime measurement); one roll table over every section (loses the printed roll
  numbers and the two Core dice modes); the flat strip on two rows (46 px more sticky header on
  every desktop page, more with each source); the label «Другие источники» / "Other sources"
  (143 px, the tables strip at 162 px at 768, over its 150 px cap, and it sits beside "Other").
- Evidence: eleven tabs were 1123 px in Russian (2026-10-20), two rows at 768; a twelfth wrapped
  1180 too. Six are 607 px: one row and a 106 px header from 640 px, before and after the cutoff.
- Accepted trade-off: two presses to a supplement; the Communities roll button below a 360x740 fold.
