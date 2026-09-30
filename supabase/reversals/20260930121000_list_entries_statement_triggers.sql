-- Restores the row triggers as 20260925130100_lists.sql and 20260925130400_legacy_move.sql made them.
drop trigger list_entries_touch_insert on public.list_entries;
drop trigger list_entries_touch_update on public.list_entries;
drop trigger list_entries_touch_delete on public.list_entries;
drop trigger list_entries_limit_insert on public.list_entries;
drop trigger list_entries_limit_update on public.list_entries;

create or replace function public.list_entries_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.lists set revision = revision + 1, updated_at = now()
    where id in (new.list_id, old.list_id);
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
  v_owner uuid;
  v_limit integer;
begin
  if current_setting('dhloot.move', true) = 'on' then
    return null;
  end if;
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

create trigger list_entries_touch after insert or update or delete on public.list_entries
  for each row execute function public.list_entries_touch();
create trigger list_entries_limit after insert or update of list_id on public.list_entries
  for each row execute function public.list_entries_limit();
