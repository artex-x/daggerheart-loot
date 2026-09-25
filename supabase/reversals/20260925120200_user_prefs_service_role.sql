-- Takes back the E2E admin client's read and delete on user_prefs.
revoke select, delete on table public.user_prefs from service_role;
