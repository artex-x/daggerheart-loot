# 2026-09-25 - A blocker fix pass also carries the batch's local nits

- Task: `persist-1-auth` (the human's request of this date).
- Decision: on a fix-then-continue review, the one remediation pass carries
  the blockers and every nit that is cheap, local and safe inside the paths
  the batch touched, mid-plan as well as on the terminal batch. A nit that
  needs a redesign, a public-contract change, a new spec or work outside
  those paths still goes to Deferred or a later batch. An approve with only
  nits mid-plan still spends no cycle. Gates do not move: a nit fix that
  breaks one is reverted and reported.
- Rejected: always deferring nits mid-plan - the fix pass's dispatch and
  gates are already paid, a nit in the same paths adds almost nothing to
  them, and a deferred one costs a pass later (`365952c` ran `npm run check`
  over the same `tests/e2e/` and CI paths as three nits it left behind).
