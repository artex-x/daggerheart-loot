-- Undoes 20261015120100_account_delete_requests.sql; its grants go with it.
-- A frontend that deletes the requests first gets PGRST202 and calls
-- delete_account() alone, as the previous frontend does (.claude/README.md,
-- "Supabase configuration").
drop function public.delete_account_requests();
