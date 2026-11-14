-- Undoes 20261113120000_api_client_guard.sql. Switch the OAuth server off (or
-- revoke every grant) first: without the guard a connected app's token reaches
-- the whole account. .claude/README.md, "Supabase configuration".
alter role authenticator reset pgrst.db_pre_request;
drop policy objects_no_client_delete on storage.objects;
drop policy objects_no_client_update on storage.objects;
drop policy objects_no_client_insert on storage.objects;
drop policy print_sets_no_client on public.print_sets;
drop policy user_prefs_no_client on public.user_prefs;
drop function public.api_client_guard();
drop function public.api_client_session_live();
notify pgrst, 'reload config';
