# 2026-09-25 - The reversibility base check walks forward from one reset; `check:db` resets three times, whatever the migration count

- Task: `persist-2-lists` (planner, 2026-09-25: seven migrations took
  723 s, past the 600 s cap; a `db reset --local` costs 60-70 s here).
- Decision: the base check resets once, to the first migration, then walks
  the rest in order: a reversible one is snapshotted, applied, reversed,
  required back to the snapshot and applied again; an additive one is only
  applied. The walk must end in the schema the applier test left (the
  up-down-up check's snapshot), which that test proves equal to the CLI's
  own reset. The applier test ends fully migrated and resets nothing; only
  a failed run resets. A run pays three resets (runner, applier, walk), and a
  new migration adds seconds of client work, never a reset.
- Rejected: one reset per migration (the cost that broke the cap); a
  per-file suite with a set-arming observer (hook work for a cost the file
  count does not drive); `SKIP_CHECK_GATE=1` (every schema batch again);
  checking only unpushed migrations (in CI every one is on a remote ref);
  a base built from the reversals (a leaky reversal pollutes its own base).
