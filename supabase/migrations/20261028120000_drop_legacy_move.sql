-- Takes the browser-list move out of the database: the function, the limit
-- guard and the fingerprint column.
-- docs/decisions/2026-10-28-r10-drops-the-move-function-and-the-fingerprint-column.md.
drop function public.move_legacy_list(uuid, text);

-- The count limits hold for every insert again.
create or replace function public.lists_limit()
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

create or replace function public.list_entries_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lists uuid[];
  v_list uuid;
  v_owner uuid;
  v_limit integer;
begin
  if tg_op = 'INSERT' then
    select array_agg(distinct n.list_id order by n.list_id) into v_lists from new_rows n;
  else
    select array_agg(distinct n.list_id order by n.list_id) into v_lists
      from new_rows n left join old_rows o on o.id = n.id
      where o.id is null or o.list_id <> n.list_id;
  end if;
  foreach v_list in array coalesce(v_lists, '{}') loop
    perform pg_advisory_xact_lock(hashtext('entries:' || v_list::text));
    select l.owner_id into v_owner from public.lists l where l.id = v_list;
    v_limit := public.effective_limit(v_owner, 'entries_per_list');
    if v_limit is not null
       and (select count(*) from public.list_entries e where e.list_id = v_list) > v_limit then
      raise exception 'limit: entries_per_list' using errcode = 'P0001', detail = v_limit::text;
    end if;
  end loop;
  return null;
end;
$$;

-- Trigger functions run as their owner and need no caller's EXECUTE.
revoke execute on function public.lists_limit() from public, anon, authenticated;
revoke execute on function public.list_entries_limit() from public, anon, authenticated;

drop index public.lists_legacy_fingerprint;
alter table public.lists drop column legacy_fingerprint;
