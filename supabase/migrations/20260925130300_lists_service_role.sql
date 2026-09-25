-- The hosted E2E's admin client (the secret key, role service_role) reads
-- and clears the rows of the cloud lists. auto_expose_new_tables = false
-- (supabase/config.toml) gives a new table's Data API roles no read or
-- write by default, so service_role is granted the two the harness needs.
grant select, delete on table public.lists, public.list_entries, public.list_shares
  to service_role;
