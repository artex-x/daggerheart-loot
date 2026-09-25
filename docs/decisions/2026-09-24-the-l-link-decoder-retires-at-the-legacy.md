# 2026-09-24 - The `#/l/` link decoder retires at the legacy write cutoff

- Task: `persistent-storage` (owner decision, 2026-09-24).
- Decision: content-bearing `#/l/<payload>` links stop decoding on the
  same date local lists become read-only (`LEGACY_WRITE_UNTIL`, set 30 or
  more days after the migration release is live). Cloud lists never write
  one. From that date `#/l/` draws a retired-link page and the link buttons
  and link import vanish from local lists; a local list's only structured
  export is migration into an account, beside copy text and print. The
  codec, its fixtures, `tests/contracts.js`'s encoding half and the
  `llms.txt` section are removed by a release dispatched after the date;
  `#/l/` keeps a route kind so the page is reached, never the home fallback.
- Rejected: keeping the decoder read-only for good (the planner's
  recommendation; small and pure, every pasted link kept opening) - the
  owner prefers one list model and one link format; a second, later date -
  two announcements for one change.
