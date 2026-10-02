-- A shared page's re-read names the revision it shows, and a list's frozen
-- copies hold at most snapshot_bytes_per_list bytes together.

-- A re-read that names a revision the list has not passed downloads one small
-- answer. get_shared_list(text) keeps its body and grants; neither function has
-- a default, so PostgREST picks one by the argument names. Security invoker:
-- the projection is still built by get_shared_list(text).
-- docs/decisions/2026-10-02-a-shared-page-re-read-names-its-revision.md.
create function public.get_shared_list(p_token text, p_since bigint)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v jsonb := public.get_shared_list(p_token);
begin
  if v is not null and p_since is not null
     and (v ->> 'revision')::bigint <= p_since then
    return jsonb_build_object('unchanged', true);
  end if;
  return v;
end;
$$;

revoke execute on function public.get_shared_list(text, bigint) from public;
grant execute on function public.get_shared_list(text, bigint) to anon, authenticated;

-- docs/decisions/2026-10-02-a-lists-frozen-copies-hold-up-to-1048576-bytes.md.
insert into public.limit_defaults (key, value) values ('snapshot_bytes_per_list', 1048576);

-- After the statement, per list that gained or changed a frozen copy: a row
-- whose id, list or snapshot is new. Transition tables do not pair rows, and a
-- client may update id itself, so an unchanged copy is one with an old twin of
-- the same id, list and snapshot; a reorder or a note edit checks nothing, and
-- a list already past the limit keeps its copies. The lock is the entry
-- limit's, so two sessions of one list are ordered.
create function public.list_entries_snapshot_limit()
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
    select array_agg(distinct n.list_id order by n.list_id) into v_lists
      from new_rows n where n.snapshot is not null;
  else
    select array_agg(distinct n.list_id order by n.list_id) into v_lists
      from new_rows n
      where n.snapshot is not null
        and not exists (
          select 1 from old_rows o
          where o.id = n.id and o.list_id = n.list_id and o.snapshot = n.snapshot
        );
  end if;
  foreach v_list in array coalesce(v_lists, '{}') loop
    perform pg_advisory_xact_lock(hashtext('entries:' || v_list::text));
    select l.owner_id into v_owner from public.lists l where l.id = v_list;
    v_limit := public.effective_limit(v_owner, 'snapshot_bytes_per_list');
    if v_limit is not null
       and (select coalesce(sum(octet_length(e.snapshot::text)), 0)
              from public.list_entries e
              where e.list_id = v_list and e.snapshot is not null) > v_limit then
      raise exception 'limit: snapshot_bytes_per_list'
        using errcode = 'P0001', detail = v_limit::text;
    end if;
  end loop;
  return null;
end;
$$;

-- Named after list_entries_limit_*: after-triggers fire by name, so a statement
-- past both limits is refused as entries_per_list.
create trigger list_entries_snapshot_limit_insert after insert on public.list_entries
  referencing new table as new_rows
  for each statement execute function public.list_entries_snapshot_limit();
create trigger list_entries_snapshot_limit_update after update on public.list_entries
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.list_entries_snapshot_limit();

revoke execute on function public.list_entries_snapshot_limit() from public, anon, authenticated;
