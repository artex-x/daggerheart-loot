-- A connected app's token (an OAuth access token of the Supabase OAuth 2.1
-- server: `client_id` and `session_id` in its claims) reaches only the tables
-- and functions of the account API's scope, the "UI action coverage" of the
-- ai-mcp task; the app's own session token and anon are unchanged. PostgREST
-- runs api_client_guard() before every request (pgrst.db_pre_request); the
-- restrictive policies bound what the guard cannot see: an embedded read, and
-- a Storage write, which never passes PostgREST. A later operation that needs
-- another name changes the lists below in a new migration.
-- docs/decisions/2026-11-13-a-connected-app-reaches-only-the-api-s-account-scope.md.

-- Whether the token's own session still has its auth.sessions row: a revoked
-- grant deletes the sessions of its client, so its unexpired access token
-- stops here. It takes no argument and reads only the caller's claim, so it
-- answers nothing about another session; a missing or malformed claim is
-- false, never a cast error.
create function public.api_client_session_live()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_raw text := auth.jwt() ->> 'session_id';
begin
  if v_raw is null
    or v_raw !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return exists (
    select 1 from auth.sessions s
    where s.id = v_raw::uuid
      and s.user_id = auth.uid()
      and (s.not_after is null or s.not_after > now()));
end;
$$;

revoke execute on function public.api_client_session_live() from public, anon;
grant execute on function public.api_client_session_live() to authenticated;

-- The request's method and path as PostgREST sets them, by exact equality:
-- HEAD is judged as GET, and every name outside the lists is refused (42501,
-- HTTP 403).
create function public.api_client_guard()
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_method text;
  v_path text;
begin
  if (select auth.jwt() ->> 'client_id') is null then
    return;
  end if;
  if not public.api_client_session_live() then
    raise exception 'api_client_guard: the session of this token has ended'
      using errcode = '42501';
  end if;
  v_method := upper(coalesce(current_setting('request.method', true), ''));
  if v_method = 'HEAD' then
    v_method := 'GET';
  end if;
  v_path := coalesce(current_setting('request.path', true), '');
  if (v_method = 'GET' and v_path = any (array[
        '/lists', '/list_entries', '/list_shares', '/purchase_requests',
        '/purchase_request_lines', '/list_notices', '/homebrew_items',
        '/homebrew_books', '/homebrew_cards']))
    or (v_method = 'POST' and v_path = any (array[
        '/homebrew_items', '/homebrew_books', '/homebrew_cards',
        '/rpc/apply_list_writes', '/rpc/import_lists', '/rpc/my_limit',
        '/rpc/get_homebrew_items', '/rpc/get_homebrew_item', '/rpc/create_list_share',
        '/rpc/revoke_list_share', '/rpc/clone_shared_list', '/rpc/create_purchase_request',
        '/rpc/apply_purchase_request', '/rpc/decline_purchase_request',
        '/rpc/mark_list_read', '/rpc/import_homebrew', '/rpc/move_homebrew_items',
        '/rpc/delete_homebrew_items', '/rpc/create_print_set']))
    or (v_method = 'PATCH' and v_path = any (array[
        '/lists', '/homebrew_items', '/homebrew_books', '/homebrew_cards']))
    or (v_method = 'DELETE' and v_path = any (array[
        '/lists', '/list_notices', '/homebrew_items', '/homebrew_books',
        '/homebrew_cards'])) then
    return;
  end if;
  raise exception 'api_client_guard: not allowed for a connected app'
    using errcode = '42501';
end;
$$;

-- PostgREST runs it for every role it switches to, anon included.
revoke execute on function public.api_client_guard() from public;
grant execute on function public.api_client_guard() to anon, authenticated, service_role;

alter role authenticator set pgrst.db_pre_request = 'public.api_client_guard';

-- The tables outside the guard's GET list that a Data API role can reach. An
-- embedded read (`lists?select=*,user_prefs(*)`) never names their path.
create policy user_prefs_no_client on public.user_prefs
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'client_id') is null)
  with check ((select auth.jwt() ->> 'client_id') is null);

create policy print_sets_no_client on public.print_sets
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'client_id') is null)
  with check ((select auth.jwt() ->> 'client_id') is null);

-- A connected app uploads pictures under homebrew_art_insert, as the app does;
-- an update or a delete is refused although no permissive policy allows one
-- today. Never `for all`: a restrictive `for all` also refuses the insert.
create policy objects_no_client_update on storage.objects
  as restrictive for update to authenticated
  using ((select auth.jwt() ->> 'client_id') is null)
  with check ((select auth.jwt() ->> 'client_id') is null);

create policy objects_no_client_delete on storage.objects
  as restrictive for delete to authenticated
  using ((select auth.jwt() ->> 'client_id') is null);

notify pgrst, 'reload config';
