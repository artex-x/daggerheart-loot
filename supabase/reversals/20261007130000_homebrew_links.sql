-- Undoes 20261007130000_homebrew_links.sql. The frozen copy with no own holder
-- that the migration deleted is not restored (its owner released it,
-- 2026-10-06), and every notice is dropped. An entry that links another
-- account's item becomes a frozen copy of the live item again; one that links
-- the list owner's own item becomes a reference. A pending request expires 1
-- hour after its creation again. Revert the app first (.claude/README.md,
-- "Undo a deploy that carried a migration").

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
begin
  delete from public.purchase_requests r
    where r.decided_at < now() - interval '24 hours'
      or (r.status = 'pending' and r.expires_at < now() - interval '24 hours');
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
  delete from cron.job_run_details d where d.end_time < now() - interval '7 days';
  get diagnostics v_runs = row_count;
  return jsonb_build_object('requests', v_requests, 'shares', v_shares, 'runs', v_runs);
end;
$$;

drop function public.get_homebrew_items(uuid[]);
drop function public.get_homebrew_item(uuid);
drop function public.mark_list_read(uuid);

create or replace function public.create_purchase_request(p_id uuid, p_token text, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_share public.list_shares;
  v_owner uuid;
  v_other uuid;
  v_max integer;
begin
  -- The token before the id: a bad token always gets the one answer, as
  -- get_shared_list() gives for a null, malformed, unknown or stopped one.
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  select * into v_share from public.list_shares s
    where s.token = p_token and s.revoked_at is null;
  if not found then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  if p_id is null then
    raise exception 'request: bad id' using errcode = '22023';
  end if;
  select l.owner_id into v_owner from public.lists l where l.id = v_share.list_id;

  -- Two sends to one list count the rate and the cap in order, as the
  -- limit triggers do.
  perform pg_advisory_xact_lock(hashtext('requests:' || v_share.list_id::text));

  select r.share_id into v_other from public.purchase_requests r where r.id = p_id;
  if found then
    if v_other = v_share.id then
      return;
    end if;
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if octet_length(p_lines::text) > 32768 or jsonb_array_length(p_lines) < 1 then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) as e
    where jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e -> 'item') is distinct from 'string'
      or jsonb_typeof(e -> 'qty') is distinct from 'number'
      or not coalesce((e ->> 'item') ~ '^[A-Za-z0-9_-]{1,64}$', false)
      or not coalesce((e ->> 'qty') ~ '^[0-9]{1,2}$', false)
  ) then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) as e where (e ->> 'qty')::integer < 1
  ) or (
    select count(distinct e ->> 'item') from jsonb_array_elements(p_lines) as e
  ) <> jsonb_array_length(p_lines) then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;

  v_max := public.effective_limit(v_owner, 'request_lines');
  if v_max is not null and jsonb_array_length(p_lines) > v_max then
    raise exception 'limit: request_lines' using errcode = 'P0001', detail = v_max::text;
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_lines) as e
    where not exists (
      select 1 from public.list_entries le
      where le.list_id = v_share.list_id and le.item_key = e ->> 'item')
  ) then
    raise exception 'request: stale' using errcode = '22023';
  end if;

  if (
    select count(*) from public.purchase_requests r
    where r.share_id = v_share.id and r.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'limit: request_rate' using errcode = 'P0001', detail = '5';
  end if;

  v_max := public.effective_limit(v_owner, 'pending_requests_per_list');
  if v_max is not null and (
    select count(*) from public.purchase_requests r
    where r.list_id = v_share.list_id and r.status = 'pending' and r.expires_at > now()
  ) >= v_max then
    raise exception 'limit: pending_requests_per_list' using errcode = 'P0001',
      detail = v_max::text;
  end if;

  insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
    values (p_id, v_share.list_id, v_share.id, v_share.audience, now() + interval '1 hour')
    on conflict (id) do nothing
    returning id into v_other;
  -- The id was taken on another list after the replay read: the list lock
  -- does not cover it.
  if not found then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  -- A scalar read, not a join: an entry deleted since the stale check
  -- leaves its line with a null price instead of dropping it.
  insert into public.purchase_request_lines (request_id, item_key, quantity, price_coins)
    select p_id, e ->> 'item', (e ->> 'qty')::integer,
      (select le.price_coins from public.list_entries le
        where le.list_id = v_share.list_id and le.item_key = e ->> 'item')
    from jsonb_array_elements(p_lines) as e;
end;
$$;

create or replace function public.apply_purchase_request(p_id uuid, p_clamp boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.purchase_requests;
  v_short jsonb;
  v_none boolean;
  v_deleted integer;
  v_taken integer;
begin
  select r.* into v_req from public.purchase_requests r
    join public.lists l on l.id = r.list_id
    where r.id = p_id and l.owner_id = auth.uid()
    for update of r;
  if not found then
    raise exception 'request: not the owner of the request' using errcode = '42501';
  end if;
  -- The list row before the entries: two decisions on one list run in
  -- order, so the renumber below never waits on an entry another apply holds.
  perform 1 from public.lists l where l.id = v_req.list_id for no key update;
  if v_req.status <> 'pending' then
    raise exception 'request: decided' using errcode = '22023';
  end if;
  if v_req.expires_at <= now() then
    raise exception 'request: expired' using errcode = '22023';
  end if;

  perform 1 from public.list_entries e
    where e.list_id = v_req.list_id
      and e.item_key in (
        select pl.item_key from public.purchase_request_lines pl where pl.request_id = p_id)
    order by e.id
    for update;

  select
      jsonb_agg(jsonb_build_object('item', x.item_key, 'want', x.want, 'have', x.have)
        order by x.item_key) filter (where x.want > x.have),
      bool_and(x.have = 0)
    into v_short, v_none
    from (
      select pl.item_key, pl.quantity as want, coalesce(e.quantity, 0) as have
      from public.purchase_request_lines pl
      left join public.list_entries e
        on e.list_id = v_req.list_id and e.item_key = pl.item_key
      where pl.request_id = p_id
    ) x;
  if v_short is not null and (not coalesce(p_clamp, false) or v_none) then
    return jsonb_build_object('short', v_short);
  end if;

  update public.purchase_request_lines pl
    set applied_quantity = least(pl.quantity, coalesce((
      select e.quantity from public.list_entries e
      where e.list_id = v_req.list_id and e.item_key = pl.item_key), 0))
    where pl.request_id = p_id;
  delete from public.list_entries e
    using public.purchase_request_lines pl
    where pl.request_id = p_id and e.list_id = v_req.list_id and e.item_key = pl.item_key
      and e.quantity = pl.applied_quantity;
  get diagnostics v_deleted = row_count;
  update public.list_entries e
    set quantity = e.quantity - pl.applied_quantity
    from public.purchase_request_lines pl
    where pl.request_id = p_id and e.list_id = v_req.list_id and e.item_key = pl.item_key
      and pl.applied_quantity > 0;
  -- A delete leaves a gap; the renumber to 0..n-1 keeps the owner's next
  -- add at the end from sharing a position.
  if v_deleted > 0 then
    perform public.reorder_list(v_req.list_id, '{}');
  end if;

  update public.purchase_requests r set status = 'applied', decided_at = now()
    where r.id = p_id;
  select coalesce(sum(pl.applied_quantity), 0)::integer into v_taken
    from public.purchase_request_lines pl where pl.request_id = p_id;
  return jsonb_build_object('applied', true, 'taken', v_taken);
end;
$$;

create or replace function public.decline_purchase_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.purchase_requests;
begin
  select r.* into v_req from public.purchase_requests r
    join public.lists l on l.id = r.list_id
    where r.id = p_id and l.owner_id = auth.uid()
    for update of r;
  if not found then
    raise exception 'request: not the owner of the request' using errcode = '42501';
  end if;
  perform 1 from public.lists l where l.id = v_req.list_id for no key update;
  if v_req.status <> 'pending' then
    raise exception 'request: decided' using errcode = '22023';
  end if;
  if v_req.expires_at <= now() then
    raise exception 'request: expired' using errcode = '22023';
  end if;
  update public.purchase_requests r set status = 'declined', decided_at = now()
    where r.id = p_id;
end;
$$;

update public.purchase_requests r
  set expires_at = least(r.expires_at, r.created_at + interval '1 hour')
  where r.status = 'pending';
alter table public.purchase_requests drop column read_at;

drop trigger list_notices_broadcast on public.list_notices;
drop function public.list_notices_broadcast();
drop table public.list_notices;

alter table public.list_entries drop constraint list_entries_snapshot_null;

update public.list_entries e set snapshot = public.homebrew_item_record(e.hb_item)
  from public.lists l, public.homebrew_items i
  where l.id = e.list_id and i.id = e.hb_item and i.owner_id <> l.owner_id;

alter table public.list_entries
  add constraint list_entries_snapshot_source check (source = 'homebrew' or snapshot is null),
  add constraint list_entries_snapshot_valid check (snapshot is null
    or (public.homebrew_snapshot_valid(snapshot) and snapshot ->> 'id' = item_key)),
  add constraint list_entries_snapshot_size
    check (snapshot is null or octet_length(snapshot::text) <= 131072);

create or replace function public.homebrew_items_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.lists l set revision = revision + 1, updated_at = now()
    where l.owner_id = new.owner_id
      and exists (
        select 1 from public.list_entries e
        where e.list_id = l.id and e.source = 'homebrew' and e.snapshot is null
          and e.item_key = new.key);
  return null;
end;
$$;

create or replace function public.homebrew_books_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.lists l set revision = revision + 1, updated_at = now()
    where l.owner_id = new.owner_id
      and exists (
        select 1 from public.list_entries e
        join public.homebrew_items i on i.owner_id = new.owner_id and i.key = e.item_key
        where e.list_id = l.id and e.source = 'homebrew' and e.snapshot is null
          and i.book_id = new.id);
  return null;
end;
$$;

create or replace function public.homebrew_cards_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := coalesce(new.owner_id, old.owner_id);
  v_key text := coalesce(new.key, old.key);
begin
  update public.lists l set revision = revision + 1, updated_at = now()
    where l.owner_id = v_owner
      and exists (
        select 1 from public.list_entries e
        join public.homebrew_items i on i.owner_id = v_owner and i.key = e.item_key
        where e.list_id = l.id and e.source = 'homebrew' and e.snapshot is null
          and (i.content ->> 'set' = v_key
            or coalesce(i.content -> 'refs', '[]'::jsonb) ? v_key));
  return null;
end;
$$;

create or replace function public.homebrew_items_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.list_entries e using public.lists l
    where l.id = e.list_id and l.owner_id = old.owner_id
      and e.source = 'homebrew' and e.snapshot is null and e.item_key = old.key;
  return old;
end;
$$;

drop function public.homebrew_links_touch(uuid[], text);

create or replace function public.get_shared_list(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_share public.list_shares;
  v_list public.lists;
  v_gm boolean;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    return null;
  end if;
  select * into v_share from public.list_shares s
    where s.token = p_token and s.revoked_at is null;
  if not found then
    return null;
  end if;
  select * into v_list from public.lists l where l.id = v_share.list_id;
  v_gm := v_share.audience = 'gm';
  return jsonb_build_object(
    'audience', v_share.audience,
    'revision', v_list.revision,
    'updated_at', v_list.updated_at,
    'topic_key', v_share.topic_key,
    'list', jsonb_build_object(
        'name', v_list.name,
        'money_mode', v_list.money_mode,
        'player_note', v_list.player_note)
      || case when v_gm then jsonb_build_object('gm_note', v_list.gm_note)
         else '{}'::jsonb end,
    'entries', coalesce((
      select jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'item_key', e.item_key,
            'source', e.source,
            'snapshot', case when e.source = 'homebrew' and e.snapshot is null
              then (
                select public.homebrew_snapshot_of(i.key, i.content, case when b.id is null
                    then null else b.content || jsonb_build_object('key', b.key) end,
                  (select jsonb_agg(c.content || jsonb_build_object('key', c.key, 'kind', c.kind))
                    from public.homebrew_cards c
                    where c.owner_id = v_list.owner_id
                      and ((c.kind = 'set' and c.key = i.content ->> 'set')
                        or (c.kind = 'ref'
                          and coalesce(i.content -> 'refs', '[]'::jsonb) ? c.key))))
                from public.homebrew_items i
                left join public.homebrew_books b on b.id = i.book_id
                where i.owner_id = v_list.owner_id and i.key = e.item_key)
              else e.snapshot end,
            'position', e.position,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note)
             else '{}'::jsonb end
          order by e.position, e.id)
      from public.list_entries e where e.list_id = v_list.id), '[]'::jsonb));
end;
$$;

create or replace function public.clone_shared_list(p_token text, p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shared jsonb;
  v_inserted uuid;
  v_owner uuid;
begin
  if auth.uid() is null then
    raise exception 'clone_shared_list: not signed in' using errcode = '28000';
  end if;
  v_shared := public.get_shared_list(p_token);
  if v_shared is null then
    raise exception 'clone_shared_list: unknown link' using errcode = '22023';
  end if;
  select l.owner_id into v_owner from public.list_shares s
    join public.lists l on l.id = s.list_id
    where s.token = p_token and s.revoked_at is null;
  insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
    values (
      p_id,
      auth.uid(),
      v_shared -> 'list' ->> 'name',
      v_shared -> 'list' ->> 'money_mode',
      v_shared -> 'list' ->> 'player_note',
      coalesce(v_shared -> 'list' ->> 'gm_note', ''))
    on conflict (id) do nothing
    returning id into v_inserted;
  if v_inserted is null then
    if not exists (
      select 1 from public.lists l where l.id = p_id and l.owner_id = auth.uid()
    ) then
      raise exception 'clone_shared_list: the id belongs to another list' using errcode = '42501';
    end if;
    return p_id;
  end if;
  insert into public.list_entries (
      id, list_id, item_key, source, snapshot, position, quantity, price_coins,
      player_note, gm_note)
    select
      gen_random_uuid(),
      p_id,
      e ->> 'item_key',
      e ->> 'source',
      case when e ->> 'source' = 'homebrew' and v_owner = auth.uid()
             and exists (select 1 from public.list_entries s
                         where s.id = (e ->> 'id')::uuid and s.snapshot is null)
           then null
           else nullif(e -> 'snapshot', 'null'::jsonb) end,
      (e ->> 'position')::integer,
      (e ->> 'quantity')::integer,
      (e ->> 'price_coins')::integer,
      e ->> 'player_note',
      coalesce(e ->> 'gm_note', '')
    from jsonb_array_elements(v_shared -> 'entries') as e;
  return p_id;
end;
$$;

create or replace function public.apply_list_writes(p_ops jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_op jsonb;
  v_kind text;
  v_id uuid;
  v_patch jsonb;
  v_field text;
  v_out jsonb := '[]'::jsonb;
  v_state text;
  v_msg text;
  v_detail text;
begin
  if auth.uid() is null then
    raise exception 'apply_list_writes: not signed in' using errcode = '28000';
  end if;
  if p_ops is null or jsonb_typeof(p_ops) <> 'array' then
    raise exception 'apply_list_writes: not a list of writes' using errcode = '22023';
  end if;
  if jsonb_array_length(p_ops) > 200 then
    raise exception 'apply_list_writes: more than 200 writes' using errcode = '22023';
  end if;
  for v_op in
    select t.e from jsonb_array_elements(p_ops) with ordinality as t(e, n) order by t.n
  loop
    begin
      v_kind := case when jsonb_typeof(v_op) = 'object' then v_op ->> 'op' end;
      case v_kind
        when 'create', 'add' then
          if v_kind = 'create' then
            if jsonb_typeof(v_op -> 'list') is distinct from 'object' then
              raise exception 'apply_list_writes: invalid list' using errcode = '22023';
            end if;
            v_id := (v_op #>> '{list,id}')::uuid;
            insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
              select v_id, auth.uid(), x.name, x.money_mode, x.player_note, x.gm_note
              from jsonb_to_record(v_op -> 'list')
                as x(name text, money_mode text, player_note text, gm_note text)
              on conflict (id) do nothing;
            -- Row level security hides another owner's row: a conflict with
            -- it inserts nothing, and this read finds nothing.
            if not exists (select 1 from public.lists l where l.id = v_id) then
              raise exception 'apply_list_writes: the id belongs to another list'
                using errcode = '42501';
            end if;
          else
            v_id := (v_op ->> 'list_id')::uuid;
            if v_id is null then
              raise exception 'apply_list_writes: invalid id' using errcode = '22023';
            end if;
            -- A list deleted meanwhile, or hidden by row level security, is
            -- gone, as for an update: the insert policy would answer 42501.
            if not exists (select 1 from public.lists l where l.id = v_id) then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
          if jsonb_typeof(v_op -> 'entries') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid entries' using errcode = '22023';
          end if;
          if jsonb_array_length(v_op -> 'entries') > 5000 then
            raise exception 'apply_list_writes: more than 5000 entries' using errcode = '22023';
          end if;
          insert into public.list_entries (id, list_id, item_key, source, snapshot, position,
              quantity, price_coins, player_note, gm_note)
            select x.id, v_id, x.item_key, x.source, x.snapshot, x.position, x.quantity,
              x.price_coins, x.player_note, x.gm_note
            from jsonb_to_recordset(v_op -> 'entries') as x(id uuid, item_key text,
              source text, snapshot jsonb, position integer, quantity integer,
              price_coins integer, player_note text, gm_note text)
            on conflict (id) do nothing;
        when 'update' then
          if v_op ->> 'id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          v_patch := v_op -> 'patch';
          if jsonb_typeof(v_patch) is distinct from 'object' then
            raise exception 'apply_list_writes: invalid patch' using errcode = '22023';
          end if;
          select k into v_field from jsonb_object_keys(v_patch) as k
            where k not in ('name', 'money_mode', 'player_note', 'gm_note') limit 1;
          if found then
            raise exception 'apply_list_writes: unknown field %', v_field using errcode = '22023';
          end if;
          if v_patch <> '{}'::jsonb then
            update public.lists l set
                name = case when v_patch ? 'name' then v_patch ->> 'name' else l.name end,
                money_mode = case when v_patch ? 'money_mode'
                  then v_patch ->> 'money_mode' else l.money_mode end,
                player_note = case when v_patch ? 'player_note'
                  then v_patch ->> 'player_note' else l.player_note end,
                gm_note = case when v_patch ? 'gm_note' then v_patch ->> 'gm_note' else l.gm_note end
              where l.id = (v_op ->> 'id')::uuid;
            -- A row deleted meanwhile, or hidden by row level security, is
            -- reported, so the client does not show a gone list as saved.
            if not found then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
        when 'remove' then
          delete from public.lists l where l.id = (v_op ->> 'id')::uuid;
        when 'update_entry' then
          if v_op ->> 'id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          v_patch := v_op -> 'patch';
          if jsonb_typeof(v_patch) is distinct from 'object' then
            raise exception 'apply_list_writes: invalid patch' using errcode = '22023';
          end if;
          select k into v_field from jsonb_object_keys(v_patch) as k
            where k not in ('quantity', 'price_coins', 'player_note', 'gm_note') limit 1;
          if found then
            raise exception 'apply_list_writes: unknown field %', v_field using errcode = '22023';
          end if;
          if v_patch <> '{}'::jsonb then
            update public.list_entries e set
                quantity = case when v_patch ? 'quantity'
                  then (v_patch ->> 'quantity')::integer else e.quantity end,
                price_coins = case when v_patch ? 'price_coins'
                  then (v_patch ->> 'price_coins')::integer else e.price_coins end,
                player_note = case when v_patch ? 'player_note'
                  then v_patch ->> 'player_note' else e.player_note end,
                gm_note = case when v_patch ? 'gm_note' then v_patch ->> 'gm_note' else e.gm_note end
              where e.id = (v_op ->> 'id')::uuid;
            if not found then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
        when 'remove_entries' then
          if jsonb_typeof(v_op -> 'ids') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid ids' using errcode = '22023';
          end if;
          delete from public.list_entries e
            where e.id in (select x::uuid from jsonb_array_elements_text(v_op -> 'ids') as x);
        when 'reorder' then
          if v_op ->> 'list_id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          if jsonb_typeof(v_op -> 'ids') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid ids' using errcode = '22023';
          end if;
          if not exists (select 1 from public.lists l where l.id = (v_op ->> 'list_id')::uuid) then
            raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
          end if;
          perform public.reorder_list((v_op ->> 'list_id')::uuid, array(
            select t.x::uuid from jsonb_array_elements_text(v_op -> 'ids')
              with ordinality as t(x, n) order by t.n));
        else
          raise exception 'apply_list_writes: unknown op %', coalesce(v_kind, 'null')
            using errcode = '22023';
      end case;
      v_out := v_out || jsonb_build_array(jsonb_build_object('ok', true));
    exception
      -- The whole call fails and the client sends it again: a later write
      -- may depend on the one these undid.
      when serialization_failure or deadlock_detected then
        raise;
      when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text,
          v_detail = pg_exception_detail;
        v_out := v_out || jsonb_build_array(jsonb_build_object(
          'ok', false, 'code', v_state, 'message', v_msg, 'details', nullif(v_detail, '')));
    end;
  end loop;
  return v_out;
end;
$$;

create or replace function public.import_lists(p_lists jsonb)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'import_lists: not signed in' using errcode = '28000';
  end if;
  if p_lists is null or jsonb_typeof(p_lists) <> 'array' or jsonb_array_length(p_lists) > 1000 then
    raise exception 'import_lists: not a list of at most 1000 lists' using errcode = '22023';
  end if;
  for v_item in
    select t.e from jsonb_array_elements(p_lists) with ordinality as t(e, n) order by t.n
  loop
    -- The 5000 bound is apply_list_writes' own: the entries limit trigger answers
    -- only after the whole insert, so a huge array would cost the statement timeout.
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_item -> 'list') is distinct from 'object'
      or jsonb_typeof(v_item -> 'entries') is distinct from 'array'
      or jsonb_array_length(v_item -> 'entries') > 5000 then
      raise exception 'import_lists: invalid list' using errcode = '22023';
    end if;
    v_id := (v_item #>> '{list,id}')::uuid;
    insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
      select v_id, auth.uid(), x.name, x.money_mode, x.player_note, x.gm_note
      from jsonb_to_record(v_item -> 'list')
        as x(name text, money_mode text, player_note text, gm_note text)
      on conflict (id) do nothing;
    if found then
      v_count := v_count + 1;
    -- Row level security hides another owner's row: a conflict with it inserts
    -- nothing, and this read finds nothing. A row found is the caller's: a retry.
    elsif not exists (select 1 from public.lists l where l.id = v_id) then
      raise exception 'import_lists: the id belongs to another list' using errcode = '42501';
    end if;
    insert into public.list_entries (id, list_id, item_key, source, snapshot, position,
        quantity, price_coins, player_note, gm_note)
      select x.id, v_id, x.item_key, x.source, x.snapshot, x.position, x.quantity,
        x.price_coins, x.player_note, x.gm_note
      from jsonb_to_recordset(v_item -> 'entries') as x(id uuid, item_key text,
        source text, snapshot jsonb, position integer, quantity integer,
        price_coins integer, player_note text, gm_note text)
      on conflict (id) do nothing;
  end loop;
  return v_count;
end;
$$;

drop function public.homebrew_item_record(uuid);

insert into public.limit_defaults (key, value) values ('snapshot_bytes_per_list', 1048576);

create or replace function public.list_entries_snapshot_limit()
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

create trigger list_entries_snapshot_limit_insert after insert on public.list_entries
  referencing new table as new_rows
  for each statement execute function public.list_entries_snapshot_limit();
create trigger list_entries_snapshot_limit_update after update on public.list_entries
  referencing old table as old_rows new table as new_rows
  for each statement execute function public.list_entries_snapshot_limit();

revoke execute on function public.list_entries_snapshot_limit() from public, anon, authenticated;

drop trigger list_entries_hb_key on public.list_entries;
drop function public.list_entries_hb_key();

create or replace function public.list_entries_reference_exists()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.source = 'homebrew' and new.snapshot is null then
    perform 1 from public.homebrew_items i
      join public.lists l on l.owner_id = i.owner_id
      where l.id = new.list_id and i.key = new.item_key
      for key share of i;
    if not found then
      raise exception 'list_entries: no homebrew item %', new.item_key using errcode = '23503';
    end if;
  end if;
  return new;
end;
$$;

create trigger list_entries_reference_exists
  before insert or update of list_id, item_key, source, snapshot on public.list_entries
  for each row execute function public.list_entries_reference_exists();

revoke execute on function public.list_entries_reference_exists() from public, anon, authenticated;

alter table public.list_entries drop constraint list_entries_hb_item_source;
drop index public.list_entries_hb_item;
alter table public.list_entries drop column hb_item;
