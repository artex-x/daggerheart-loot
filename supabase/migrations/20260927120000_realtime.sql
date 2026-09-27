-- Live updates through Realtime Broadcast from the database: a list change
-- sends its final revision to the owner's private topic and to each active
-- share's topic; a stopped share sends a null revision once. A client
-- refetches through the read it already has. docs/specs/FEATURES.md,
-- "Account and browser lists"; docs/decisions/2026-09-25-share-topics-use-topic-key-and-carry-only-a.md.

-- A deferred constraint trigger fires at commit, after every entry row has
-- bumped the list, so one transaction sends one message per list with the
-- final revision; the transaction-local mark skips the list's later events.
create function public.lists_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := coalesce(new.id, old.id);
  v_done text := coalesce(current_setting('dhloot.broadcast', true), '');
  v_owner uuid;
  v_rev bigint;
  v_raw text;
  v_by text;
  v_topic uuid;
begin
  if strpos(v_done, v_id::text) > 0 then
    return null;
  end if;
  perform set_config('dhloot.broadcast', v_done || v_id::text || ',', true);
  begin
    select l.owner_id, l.revision into v_owner, v_rev from public.lists l where l.id = v_id;
    if not found then
      v_owner := coalesce(new.owner_id, old.owner_id);
      v_rev := null;
    end if;
    -- A session that set the headers in an earlier transaction reads ''.
    v_raw := nullif(current_setting('request.headers', true), '');
    begin
      v_by := (v_raw::jsonb) ->> 'x-dhloot-tab';
    exception when others then
      v_by := null;
    end;
    if v_by is not null and v_by !~ '^[A-Za-z0-9-]{1,40}$' then
      v_by := null;
    end if;
    perform realtime.send(
      jsonb_build_object('list', v_id, 'revision', v_rev, 'by', v_by),
      'list', 'owner:' || v_owner::text, true);
    for v_topic in
      select s.topic_key from public.list_shares s
      where s.list_id = v_id and s.revoked_at is null
    loop
      perform realtime.send(
        jsonb_build_object('revision', v_rev), 'revision', 'share:' || v_topic::text, true);
    end loop;
  exception when others then
    -- A broadcast never fails the owner's write.
    raise warning 'lists_broadcast: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

create constraint trigger lists_broadcast
  after insert or update or delete on public.lists
  deferrable initially deferred
  for each row execute function public.lists_broadcast();

-- A share stopped or deleted (also with its list) tells its viewers once.
create function public.list_shares_gone()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.revoked_at is null and (tg_op = 'DELETE' or new.revoked_at is not null) then
    begin
      perform realtime.send(
        jsonb_build_object('revision', null), 'revision', 'share:' || old.topic_key::text, true);
    exception when others then
      raise warning 'list_shares_gone: % (%)', sqlerrm, sqlstate;
    end;
  end if;
  return null;
end;
$$;

create trigger list_shares_gone
  after update of revoked_at or delete on public.list_shares
  for each row execute function public.list_shares_gone();

revoke execute on function public.lists_broadcast() from public, anon, authenticated;
revoke execute on function public.list_shares_gone() from public, anon, authenticated;

-- Receive only. With no insert policy no client sends on a private topic,
-- so every message comes from the triggers above. A share topic is a
-- random topic_key, not the token: its shape is the whole check.
create policy dhloot_share_topics_receive on realtime.messages
  for select to anon, authenticated
  using (realtime.messages.extension = 'broadcast'
    and realtime.topic() ~ '^share:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
create policy dhloot_owner_topic_receive on realtime.messages
  for select to authenticated
  using (realtime.messages.extension = 'broadcast'
    and realtime.topic() = 'owner:' || (select auth.uid())::text);

-- Rewrites every position of a list in one statement: the given ids that
-- are entries of the list come first, in the given order (a repeated id
-- counts once); the list's other entries follow in their (position, id)
-- order. Another list's id or a null is ignored, so a device with an old
-- entry set is not refused.
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
  if p_entries is null then
    raise exception 'reorder_list: no entry order given' using errcode = '22023';
  end if;
  update public.list_entries e set position = o.ord - 1
    from (
      select x.id, row_number() over (order by g.first nulls last, x.position, x.id) as ord
      from public.list_entries x
      left join (
        select u.id, min(u.n) as first
        from unnest(p_entries) with ordinality as u(id, n)
        where u.id is not null
        group by u.id
      ) g on g.id = x.id
      where x.list_id = p_list
    ) o
    where e.id = o.id and e.list_id = p_list;
end;
$$;
