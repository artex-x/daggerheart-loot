-- Takes back the broadcast triggers, the realtime policies and the tolerant
-- reorder: reorder_list() as 20260925130100_lists.sql made it.
drop trigger lists_broadcast on public.lists;
drop trigger list_shares_gone on public.list_shares;
drop function public.lists_broadcast();
drop function public.list_shares_gone();
drop policy dhloot_share_topics_receive on realtime.messages;
drop policy dhloot_owner_topic_receive on realtime.messages;

-- Rewrites every position of a list in one statement: p_entries holds
-- each of the list's entry ids exactly once, in the new order.
create or replace function public.reorder_list(p_list uuid, p_entries uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.lists l where l.id = p_list and l.owner_id = auth.uid()
  ) then
    raise exception 'reorder_list: not the owner of the list' using errcode = '42501';
  end if;
  if p_entries is null
     or cardinality(p_entries) <> (select count(distinct x) from unnest(p_entries) as u(x))
     or cardinality(p_entries) <> (
       select count(*) from public.list_entries e where e.list_id = p_list)
     or exists (
       select 1 from unnest(p_entries) as u(x)
       where not exists (
         select 1 from public.list_entries e where e.id = u.x and e.list_id = p_list))
  then
    raise exception 'reorder_list: entries do not match the list' using errcode = '22023';
  end if;
  update public.list_entries e set position = o.ord - 1
    from unnest(p_entries) with ordinality as o(id, ord)
    where e.id = o.id and e.list_id = p_list;
end;
$$;
