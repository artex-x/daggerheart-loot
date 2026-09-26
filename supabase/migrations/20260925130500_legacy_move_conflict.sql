-- move_legacy_list() raises 40001 when a concurrent delete removes the
-- conflicting row before its lookup, where it returned a null id; a retry
-- then inserts. docs/specs/FEATURES.md, "Lists".
drop function public.move_legacy_list(uuid, text);

-- Moves one browser list into the caller's account as the list p_id, with
-- its entries, in one transaction. p_canonical is the client's canonical
-- JSON of the list; the database hashes the exact text it parses. A second
-- call with the same text returns the row the first made (inserted false).
-- docs/specs/FEATURES.md, "Lists".
create function public.move_legacy_list(p_id uuid, p_canonical text)
returns table (id uuid, inserted boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v jsonb;
  v_fp text;
  v_id uuid;
  v_key text;
  v_bad jsonb;
  v_m jsonb;
  v_field text;
  v_n numeric;
begin
  if auth.uid() is null then
    raise exception 'move_legacy_list: not signed in' using errcode = '28000';
  end if;
  if p_id is null then
    raise exception 'move_legacy_list: no list id' using errcode = '22023';
  end if;
  if p_canonical is null then
    raise exception 'move_legacy_list: not a list' using errcode = '22023';
  end if;
  if length(p_canonical) > 1048576 then
    raise exception 'move_legacy_list: the list text is too long' using errcode = '22023';
  end if;
  begin
    v := p_canonical::jsonb;
  exception when others then
    raise exception 'move_legacy_list: not a list' using errcode = '22023';
  end;
  if jsonb_typeof(v) <> 'object' then
    raise exception 'move_legacy_list: not a list' using errcode = '22023';
  end if;
  select k into v_key from jsonb_object_keys(v) as k
    where k not in ('name', 'ids', 'meta', 'money', 'note', 'hnote') limit 1;
  if v_key is not null then
    raise exception 'move_legacy_list: unknown key %', v_key using errcode = '22023';
  end if;

  if v ? 'name' and (jsonb_typeof(v -> 'name') <> 'string'
      or char_length(v ->> 'name') > 200) then
    raise exception 'move_legacy_list: invalid name' using errcode = '22023';
  end if;
  if v ? 'money' and v -> 'money' not in ('"bag"'::jsonb, '"coin"'::jsonb) then
    raise exception 'move_legacy_list: invalid money' using errcode = '22023';
  end if;
  foreach v_field in array array['note', 'hnote'] loop
    if v ? v_field and (jsonb_typeof(v -> v_field) <> 'string'
        or char_length(v ->> v_field) > 4000) then
      raise exception 'move_legacy_list: invalid %', v_field using errcode = '22023';
    end if;
  end loop;

  if jsonb_typeof(v -> 'ids') is distinct from 'array' then
    raise exception 'move_legacy_list: invalid ids' using errcode = '22023';
  end if;
  if jsonb_array_length(v -> 'ids') > 5000 then
    raise exception 'move_legacy_list: more than 5000 ids' using errcode = '22023';
  end if;
  select e into v_bad from jsonb_array_elements(v -> 'ids') as e
    where jsonb_typeof(e) <> 'string' or (e #>> '{}') !~ '^[A-Za-z0-9_-]{1,64}$' limit 1;
  if found then
    raise exception 'move_legacy_list: invalid id %', v_bad using errcode = '22023';
  end if;
  select e into v_key from jsonb_array_elements_text(v -> 'ids') as e
    group by e having count(*) > 1 limit 1;
  if found then
    raise exception 'move_legacy_list: repeated id %', v_key using errcode = '22023';
  end if;

  if v ? 'meta' then
    if jsonb_typeof(v -> 'meta') <> 'object' then
      raise exception 'move_legacy_list: invalid meta' using errcode = '22023';
    end if;
    for v_key, v_m in select m.key, m.value from jsonb_each(v -> 'meta') as m loop
      if not ((v -> 'ids') ? v_key) then
        raise exception 'move_legacy_list: meta of % is not in ids', v_key using errcode = '22023';
      end if;
      if jsonb_typeof(v_m) <> 'object' then
        raise exception 'move_legacy_list: invalid meta of %', v_key using errcode = '22023';
      end if;
      select k into v_field from jsonb_object_keys(v_m) as k
        where k not in ('qty', 'gold', 'note', 'hnote') limit 1;
      if found then
        raise exception 'move_legacy_list: unknown meta key % of %', v_field, v_key
          using errcode = '22023';
      end if;
      -- Nested, not one condition: SQL does not promise to test the type
      -- before the cast.
      if v_m ? 'qty' then
        if jsonb_typeof(v_m -> 'qty') <> 'number' then
          raise exception 'move_legacy_list: invalid qty of %', v_key using errcode = '22023';
        end if;
        v_n := (v_m ->> 'qty')::numeric;
        if v_n <> trunc(v_n) or v_n < 1 or v_n > 99 then
          raise exception 'move_legacy_list: invalid qty of %', v_key using errcode = '22023';
        end if;
      end if;
      if v_m ? 'gold' then
        if jsonb_typeof(v_m -> 'gold') <> 'number' then
          raise exception 'move_legacy_list: invalid gold of %', v_key using errcode = '22023';
        end if;
        v_n := (v_m ->> 'gold')::numeric;
        if v_n <> trunc(v_n) or v_n < 1 or v_n > 99999 then
          raise exception 'move_legacy_list: invalid gold of %', v_key using errcode = '22023';
        end if;
      end if;
      foreach v_field in array array['note', 'hnote'] loop
        if v_m ? v_field and (jsonb_typeof(v_m -> v_field) <> 'string'
            or char_length(v_m ->> v_field) > 4000) then
          raise exception 'move_legacy_list: invalid % of %', v_field, v_key
            using errcode = '22023';
        end if;
      end loop;
    end loop;
  end if;

  v_fp := encode(sha256(convert_to(p_canonical, 'utf8')), 'hex');
  -- On only for this function's own inserts: the triggers fire at the end
  -- of each insert statement, and a later plain insert meets the limits.
  perform set_config('dhloot.move', 'on', true);
  insert into public.lists as l
      (id, owner_id, name, money_mode, player_note, gm_note, legacy_fingerprint)
    values (
      p_id,
      auth.uid(),
      coalesce(v ->> 'name', ''),
      coalesce(v ->> 'money', 'bag'),
      coalesce(v ->> 'note', ''),
      coalesce(v ->> 'hnote', ''),
      v_fp)
    on conflict (owner_id, legacy_fingerprint) where legacy_fingerprint is not null
      do nothing
    returning l.id into v_id;
  if v_id is null then
    perform set_config('dhloot.move', 'off', true);
    select l.id into v_id from public.lists l
      where l.owner_id = auth.uid() and l.legacy_fingerprint = v_fp;
    if v_id is null then
      raise exception 'move_legacy_list: the list was deleted during the move'
        using errcode = '40001';
    end if;
    id := v_id;
    inserted := false;
    return next;
    return;
  end if;
  insert into public.list_entries (
      id, list_id, item_key, position, quantity, price_coins, player_note, gm_note)
    select
      gen_random_uuid(),
      v_id,
      x.item_key,
      (x.ord - 1)::integer,
      coalesce((v #>> array['meta', x.item_key, 'qty'])::numeric::integer, 1),
      (v #>> array['meta', x.item_key, 'gold'])::numeric::integer,
      coalesce(v #>> array['meta', x.item_key, 'note'], ''),
      coalesce(v #>> array['meta', x.item_key, 'hnote'], '')
    from jsonb_array_elements_text(v -> 'ids') with ordinality as x(item_key, ord);
  perform set_config('dhloot.move', 'off', true);
  id := v_id;
  inserted := true;
  return next;
end;
$$;

revoke execute on function public.move_legacy_list(uuid, text) from public, anon;
grant execute on function public.move_legacy_list(uuid, text) to authenticated;
