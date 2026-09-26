-- Takes back the move of browser lists: move_legacy_list(), the two limit
-- trigger functions as 20260925130100_lists.sql made them, then the index
-- and the column.
drop function public.move_legacy_list(uuid, text);

drop trigger lists_limit on public.lists;
drop function public.lists_limit();

create function public.lists_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('lists:' || new.owner_id::text));
  v_limit := public.effective_limit(new.owner_id, 'lists_per_owner');
  if v_limit is not null
     and (select count(*) from public.lists l where l.owner_id = new.owner_id) > v_limit then
    raise exception 'limit: lists_per_owner' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create trigger lists_limit after insert on public.lists
  for each row execute function public.lists_limit();

drop trigger list_entries_limit on public.list_entries;
drop function public.list_entries_limit();

create function public.list_entries_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_limit integer;
begin
  if tg_op = 'UPDATE' and new.list_id = old.list_id then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtext('entries:' || new.list_id::text));
  select l.owner_id into v_owner from public.lists l where l.id = new.list_id;
  v_limit := public.effective_limit(v_owner, 'entries_per_list');
  if v_limit is not null
     and (select count(*) from public.list_entries e where e.list_id = new.list_id) > v_limit then
    raise exception 'limit: entries_per_list' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create trigger list_entries_limit after insert or update of list_id on public.list_entries
  for each row execute function public.list_entries_limit();

revoke execute on function public.lists_limit() from public, anon, authenticated;
revoke execute on function public.list_entries_limit() from public, anon, authenticated;

drop index public.lists_legacy_fingerprint;
alter table public.lists drop column legacy_fingerprint;
