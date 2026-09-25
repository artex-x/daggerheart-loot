-- Removes the count limits: effective_limit(), the overrides and the
-- defaults with their two seeded rows.
drop function public.effective_limit(uuid, text);
drop table public.user_limit_overrides;
drop table public.limit_defaults;
