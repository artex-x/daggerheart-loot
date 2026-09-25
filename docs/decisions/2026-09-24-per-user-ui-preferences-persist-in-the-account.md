# 2026-09-24 - Per-user UI preferences persist in the account, account wins

- Superseded in part by "Account preferences drop the default money mode; the print layout persists for everyone" (2026-09-24).
- Task: `persistent-storage` (owner decision, 2026-09-24; reopens the
  `profiles` cut of the same day's scope decision as one row).
- Decision: for a signed-in user the settings that live in `localStorage`
  or session memory - language, starting section, tables view, print layout
  (colour or black-and-white, compact sheet) and a default money mode for
  new lists - persist in `user_prefs(user_id, prefs jsonb)` and apply on
  every device. Precedence: the account wins; a first sign-in with no row
  seeds it from the local values; every later change writes local first,
  then the account; two devices are last write wins, refetched on focus.
  Anonymous users keep `localStorage`. No settings page: the controls stay
  where they are.
- Rejected: a separate preferences page - the controls already exist;
  local wins - a new device would silently reset the account; `profiles`
  with a display name - nothing shows one.
