# 2026-09-17 - Rejected UI/architecture options from the phase-8 review, recorded once

- Task: `phase-8` (retired; recorded here at retirement).
- Decision: no change - these alternatives were considered and rejected
  during review and have no other permanent home now that the task
  directory is gone.
- Rejected: a `<label>` emitted by `Field` (it wraps chip rows and segmented
  switches; a `<label>` around buttons is wrong); `$state.raw` for `lists`
  (a cheap present-cost win traded for a silent failure if anyone later
  mutates in place); extending the truncation checksum over the notes (a
  payload-grammar contract change for a failure the reader can see anyway);
  virtualising the row lists (370 is the largest list drawn, and it moves
  goldens); SHA-pinning the `actions/*` tags (maintenance beyond its value;
  `gitleaks` alone is pinned).
- Superseded in part by "The list store is raw state; an unchanged stored
  value is not parsed again" (2026-09-23): `$state.raw` for `lists`.
