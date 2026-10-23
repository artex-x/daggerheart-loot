# 2026-10-22 - The nightly backup leaves out the Auth sessions

- Amends "Production is backed up nightly, encrypted to the owner's key, kept 30 days" (2026-09-25): the data dump leaves out the Auth sessions.
- Task: `persist-review` (owner, decision 51: P2 "Implement now", 2026-10-22; planner, 2026-10-22).
- Decision: `backup.yml` and the safety backup of `restore:prod` dump the `auth` and `public`
  data without `DUMP_EXCLUDES` (`tools/supabase/lib.mjs`: five session and sign-in flow tables
  and the token sequence); a restore signs each restored reader out once, and its undo signs
  out every reader that production held at the restore; older artifacts expire.
- Rejected: keep the tables and rely on `age` (the key also lives on the owner's disk for the
  drill, and step 4 loads a dump into the test project, where agents write); a session timeout
  (`[auth.sessions]`, I2, dropped by the owner; it bounds a token's life, not a fresh backup);
  deleting the older artifacts at once (no restore point for up to 30 days back; they expire by
  retention); keeping the sequence (the dump's lower `setval` would pass the guard, which covers
  only the sequences of dumped tables); excluding `one_time_tokens` and the token columns of
  `users` (the app signs in by OAuth only, so no email token is issued in normal use, and each
  hash expires after 3600 s); changing the restore order or the drill's compare (both follow the
  dump; an older artifact holds the tables for 30 days).
