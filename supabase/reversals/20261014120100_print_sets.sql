-- Drops every print set: no short link opens, and printing stops until the frontend is reverted too.
-- Undoes 20261014120100_print_sets.sql: both functions, the table with its
-- indexes and the limit row (overrides cascade) go, and lifecycle_cleanup()
-- comes back verbatim. .claude/README.md, "Backups and restore".
drop function public.get_print_set(text);
drop function public.create_print_set(jsonb);
drop table public.print_sets;
delete from public.limit_defaults where key = 'print_sets_per_owner';

-- 20261007130000_homebrew_links.sql's body, plus the files: an own file over
-- an hour old that no item names (an upload whose row never came, or a delete
-- request that failed) is queued, at most 2000 a run; a name another write
-- holds locked waits for the next run. The released names go after a day.
-- Deletes the rows past their retention and answers the counts (pg_cron's
-- run log keeps only the command tag). No API role executes it.
create or replace function public.lifecycle_cleanup()
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_requests integer;
  v_shares integer;
  v_runs integer;
  v_notices integer;
  v_files integer;
  v_name text;
  v_p text;
  v_names text[] := '{}';
begin
  delete from public.purchase_requests r where r.expires_at < now();
  get diagnostics v_requests = row_count;
  -- The owner's panel draws the newest row of each audience; deleting a
  -- stopped newest row would make the panel create a new link.
  delete from public.list_shares s
    where s.revoked_at < now() - interval '30 days'
      and exists (
        select 1 from public.list_shares n
        where n.list_id = s.list_id and n.audience = s.audience
          and n.created_at > s.created_at);
  get diagnostics v_shares = row_count;
  delete from public.list_notices n
    where n.read_at < now() - interval '1 hour'
      or (n.read_at is null and n.created_at < now() - interval '30 days');
  get diagnostics v_notices = row_count;
  delete from cron.job_run_details d where d.end_time < now() - interval '7 days';
  get diagnostics v_runs = row_count;
  for v_name in
    select o.name from storage.objects o
    where o.bucket_id = 'homebrew-art' and public.homebrew_art_name_ok(o.name)
      and o.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from public.homebrew_items i
        where i.art like 'p/%' and i.art = 'p/' || substr(o.name, 3))
    order by o.created_at, o.name
    limit 2000
  loop
    v_p := 'p/' || substr(v_name, 3);
    -- Each check is its own statement: it sees a naming write that committed
    -- while the lock was held.
    if pg_try_advisory_xact_lock(hashtext('homebrew-art:' || v_p))
      and not exists (select 1 from public.homebrew_items i
        where i.art like 'p/%' and i.art = v_p) then
      insert into public.homebrew_art_released (name) values (v_p)
        on conflict (name) do update set at = now();
      v_names := v_names || v_name;
    end if;
  end loop;
  v_files := public.art_delete(v_names);
  delete from public.homebrew_art_released r where r.at < now() - interval '1 day';
  return jsonb_build_object('requests', v_requests, 'shares', v_shares, 'runs', v_runs,
    'notices', v_notices, 'files', v_files);
end;
$$;
