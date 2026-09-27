# 2026-09-27 - Display defaults are set in the account; a page switch lasts a visit

- Task: `display-settings` (owner answers of this date to the plan's Q1-Q3).
- Decision: the Display section of `#/account` sets the default tables view
  and print layout; a switch on the tables or print page changes them until
  a reload, and a note links `#/account`. The language stays one saved
  setting, and the starting-section pin buttons stay. One page, no tabs.
  Saved defaults are an account feature: local persistence for a signed-out
  reader is optional, so that reader keeps the stored default and cannot
  change it (`STATE.md`, "Account preferences").
- Rejected: a page value kept until the reader leaves the page (a return
  from a record or a second print loses it); no change (a one-off print
  changes the default on every device); removing the pin buttons (no
  signed-out pin, no pinned named table); a `#/settings` route (a contract
  change and new states for one panel); tabs in `#/account` (half a short
  page behind a click, with no address).
- Supersedes in part "Account preferences drop the default money mode; the print layout persists for everyone" (2026-09-24): a page switch no longer saves the layout.
