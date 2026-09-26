-- Applies the account write buffer in one call: each write in order, in
-- its own subtransaction, as the caller, so row level security and the
-- count limits apply as to a plain write. Answers one result per write.
-- docs/specs/FEATURES.md, "Lists".
create function public.apply_list_writes(p_ops jsonb)
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

revoke execute on function public.apply_list_writes(jsonb) from public, anon;
grant execute on function public.apply_list_writes(jsonb) to authenticated;
