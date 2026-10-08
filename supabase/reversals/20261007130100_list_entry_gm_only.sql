-- Undoes 20261007130100_list_entry_gm_only.sql: the five bodies of
-- 20261007130000_homebrew_links.sql come back, and the column goes with every
-- stored mark. After it every GM-only entry shows on the players' links:
-- revert the app first (.claude/README.md, "Undo a deploy that carried a
-- migration").
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
          -- A previous bundle's frozen copy: the list now links the item instead.
          if exists (
            select 1 from jsonb_array_elements(v_op -> 'entries') as t(e)
            where jsonb_typeof(t.e) = 'object'
              and coalesce(t.e -> 'snapshot', 'null'::jsonb) <> 'null'::jsonb
          ) then
            raise exception 'apply_list_writes: an entry holds a snapshot; send hb_item instead'
              using errcode = '22023';
          end if;
          insert into public.list_entries (id, list_id, item_key, source, hb_item, position,
              quantity, price_coins, player_note, gm_note)
            select x.id, v_id, x.item_key, x.source, x.hb_item, x.position, x.quantity,
              x.price_coins, x.player_note, x.gm_note
            from jsonb_to_recordset(v_op -> 'entries') as x(id uuid, item_key text,
              source text, hb_item uuid, position integer, quantity integer,
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
        when 'relink' then
          if v_op ->> 'id' is null or v_op ->> 'hb_item' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          update public.list_entries e set hb_item = (v_op ->> 'hb_item')::uuid
            where e.id = (v_op ->> 'id')::uuid;
          if not found then
            raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
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
            'snapshot', case when e.hb_item is null then null
              else public.homebrew_item_record(e.hb_item) end,
            'position', e.position,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when e.hb_item is null then '{}'::jsonb
             else jsonb_build_object('hid', e.hb_item) end
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
begin
  if auth.uid() is null then
    raise exception 'clone_shared_list: not signed in' using errcode = '28000';
  end if;
  v_shared := public.get_shared_list(p_token);
  if v_shared is null then
    raise exception 'clone_shared_list: unknown link' using errcode = '22023';
  end if;
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
      id, list_id, item_key, source, hb_item, position, quantity, price_coins,
      player_note, gm_note)
    select
      gen_random_uuid(),
      p_id,
      e ->> 'item_key',
      e ->> 'source',
      (e ->> 'hid')::uuid,
      (e ->> 'position')::integer,
      (e ->> 'quantity')::integer,
      (e ->> 'price_coins')::integer,
      e ->> 'player_note',
      coalesce(e ->> 'gm_note', '')
    from jsonb_array_elements(v_shared -> 'entries') as e;
  return p_id;
end;
$$;

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
    values (p_id, v_share.list_id, v_share.id, v_share.audience, now() + interval '30 days')
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
    if exists (
      select 1 from jsonb_array_elements(v_item -> 'entries') as t(e)
      where jsonb_typeof(t.e) = 'object'
        and coalesce(t.e -> 'snapshot', 'null'::jsonb) <> 'null'::jsonb
    ) then
      raise exception 'import_lists: an entry holds a snapshot; send hb_item instead'
        using errcode = '22023';
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
    insert into public.list_entries (id, list_id, item_key, source, hb_item, position,
        quantity, price_coins, player_note, gm_note)
      select x.id, v_id, x.item_key, x.source, x.hb_item, x.position, x.quantity,
        x.price_coins, x.player_note, x.gm_note
      from jsonb_to_recordset(v_item -> 'entries') as x(id uuid, item_key text,
        source text, hb_item uuid, position integer, quantity integer,
        price_coins integer, player_note text, gm_note text)
      on conflict (id) do nothing;
  end loop;
  return v_count;
end;
$$;

alter table public.list_entries drop column gm_only;
