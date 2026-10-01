# 2026-10-01 - Scale is designed for three times the default limits; nothing past that

- Task: `scale-target` (owner's rule, 2026-10-01).
- Decision: plans, reviews and audits size every surface for up to 3x each `limit_defaults`
  row: 150 lists, 300 entries per list, 300 lines per request, 30 pending requests per list, 60
  sources, 300 own items and 300 cards; a frozen copy within its own bounds. A finding reachable only past 3x is named in the
  report and dropped, not recorded in `docs/specs/DEBT.md`. The ceilings of one call
  (`docs/specs/FEATURES.md`, "Limits") stay enforced; they are not a design target.
- Context: the `scale-challenge` audit sized surfaces at the import ceilings; the owner answered
  "I would not care a lot about limits raised that hard" and "plan for x2 x3 of defaults max".
- Rejected: designing for the import ceilings, 1000 lists and 5000 entries (an override that high
  is the owner's own exception); designing for the defaults only (at 3x the requests read passes
  the 1000-row cap, so an override within reach already breaks it).
- Accepted trade-off: an account raised past 3x can meet a slow or clipped surface; the owner
  sets those overrides and accepts it.
- Amends "Plans and reviews run four standing checks without the owner asking" (2026-10-01): the scale check stops at 3x the default.
