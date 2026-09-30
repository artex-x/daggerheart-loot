-- The entry triggers of public.list_entries run once per statement: a bulk
-- write bumps each list it touched once and counts each filled list once.
-- docs/decisions/2026-09-30-the-list-entries-triggers-run-once-per-statement.md.
drop trigger list_entries_touch on public.list_entries;
drop trigger list_entries_limit on public.list_entries;

-- A statement that changes entries is one edit of each list it touched,
-- the list an entry left included.
create or replace function public.list_entries_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.lists set revision = revision + 1, updated_at = now()
      where id in (select n.list_id from new_rows n);
  elsif tg_op = 'UPDATE' then
    update public.lists set revision = revision + 1, updated_at = now()
      where id in (select n.list_id from new_rows n union select o.list_id from old_rows o);
  else
    update public.lists set revision = revision + 1, updated_at = now()
      where id in (select o.list_id from old_rows o);
  end if;
  return null;
end;
$$;

-- After the statement, per list that gained rows by an insert or a move; a
-- note edit checks nothing. The lock orders two sessions of one list.
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
  if current_setting('dhloot.move', true) = 'on' then
    return null;
  end if;
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

create trigger list_entries_touch_insert after insert on public.list_entries
  referencing new table as new_rows
  for each statement execute function public.list_entries_touch();
create trigger list_entries_touch_update after update on public.list_entries
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.list_entries_touch();
create trigger list_entries_touch_delete after delete on public.list_entries
  referencing old table as old_rows
  for each statement execute function public.list_entries_touch();
create trigger list_entries_limit_insert after insert on public.list_entries
  referencing new table as new_rows
  for each statement execute function public.list_entries_limit();
create trigger list_entries_limit_update after update on public.list_entries
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.list_entries_limit();

revoke execute on function public.list_entries_touch() from public, anon, authenticated;
revoke execute on function public.list_entries_limit() from public, anon, authenticated;
