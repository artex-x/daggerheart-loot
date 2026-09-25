# 2026-09-24 - Account preferences drop the default money mode; the print layout persists for everyone

- Task: `persist-1-auth` (owner answers of this date to the preferences
  mock's questions 1 and 2).
- Decision: the account preferences are the language, the starting
  section, the tables view and the print layout; "a default money mode for
  new lists" is removed from the release (money mode stays per list). The
  print layout (colour or black-and-white, standard or compact sheet) leaves
  session memory and is kept in `dhloot.prefs.v1` beside the tables view
  for every reader, signed in or not; the account copies it like the rest.
- Rejected: the last money mode picked on an own list as the default (a
  rule nobody sees being applied); a new money-mode control (a new control
  and its mock for one setting); persisting the print layout only for a
  signed-in reader (two behaviours for one control).
- Supersedes in part "Per-user UI preferences persist in the account, account wins" (2026-09-24).
