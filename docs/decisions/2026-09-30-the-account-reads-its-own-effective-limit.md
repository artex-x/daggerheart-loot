# 2026-09-30 - The account reads its own effective limit through `my_limit()`

- Task: `persist-7-homebrew` (owner's answer on the counters, 2026-09-30; planner, pass 4).
- Decision: `public.my_limit(p_key text)` answers `effective_limit(auth.uid(), p_key)` to a
  signed-in caller (security definer, `authenticated` only; an unknown key raises). `#/homebrew`
  draws «Мои предметы: N из M» with M from it, and «Мои предметы: N» when the limit is null. The
  database alone still enforces every limit: no client code refuses a write by it.
- Rejected: a constant in the client (an override would draw the wrong number); a grant on
  `user_limit_overrides` (a table read for one number, beside the function every trigger uses).
- Amends "Import validation is the client's; the count limits are the database's" (2026-09-26): the account may read its own limit for display.
