-- Undoes 20261022120000_shared_list_rev_and_bulk_delete.sql: the three
-- get_shared_list() forms as 20261014120000_homebrew_art.sql (text),
-- 20261002120000_read_scale.sql (text, bigint) and
-- 20261015120000_shared_list_have.sql (text, bigint, jsonb) made them, with
-- their grants; reorder_list() a definer again; the two new functions gone. A
-- reader's rev of the new form misses once and the page reads every record.
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
            'position', e.ord,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when e.hb_item is null then '{}'::jsonb
             else jsonb_strip_nulls(jsonb_build_object('hid', e.hb_item,
               'img', (select i.art from public.homebrew_items i where i.id = e.hb_item))) end
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note, 'gm_only', e.gm_only)
             else '{}'::jsonb end
          order by e.ord)
      from (select e.*, row_number() over (order by e.position, e.id) - 1 as ord
          from public.list_entries e
          where e.list_id = v_list.id and (v_gm or not e.gm_only)) e), '[]'::jsonb));
end;
$$;

revoke execute on function public.get_shared_list(text) from public;
grant execute on function public.get_shared_list(text) to anon, authenticated;

create or replace function public.get_shared_list(p_token text, p_since bigint)
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

create or replace function public.get_shared_list(p_token text, p_since bigint, p_have jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v jsonb := public.get_shared_list(p_token, p_since);
  v_have jsonb := case when jsonb_typeof(p_have) = 'object'
    and octet_length(p_have::text) <= 65536 then p_have else '{}'::jsonb end;
begin
  if v is null or v ? 'unchanged' then
    return v;
  end if;
  return jsonb_set(v, '{entries}', coalesce((
    select jsonb_agg(case when h.rev is null then e.value
        when v_have ->> (e.value ->> 'hid') = h.rev
          then (e.value - 'snapshot') || jsonb_build_object('rev', h.rev)
        else e.value || jsonb_build_object('rev', h.rev) end
      order by e.n)
    from jsonb_array_elements(v -> 'entries') with ordinality as e(value, n)
    cross join lateral (select case when e.value ? 'hid'
        and jsonb_typeof(e.value -> 'snapshot') = 'object'
        then md5((e.value -> 'snapshot')::text) end as rev) h), '[]'::jsonb));
end;
$$;

revoke execute on function public.get_shared_list(text, bigint, jsonb) from public;
grant execute on function public.get_shared_list(text, bigint, jsonb) to anon, authenticated;

alter function public.reorder_list(uuid, uuid[]) security definer;

drop function public.delete_homebrew_items(uuid[]);
drop function public.homebrew_item_rev(uuid);
