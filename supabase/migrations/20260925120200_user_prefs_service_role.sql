-- The hosted E2E's admin client (the secret key, role service_role) reads
-- and clears user_prefs rows. auto_expose_new_tables = false
-- (supabase/config.toml) gives a new table's Data API roles no read or
-- write by default, so service_role is granted the two the harness needs.
grant select, delete on table public.user_prefs to service_role;
