-- Imports a lists file as new lists of the caller: every list with its entries,
-- in one transaction, every list or none. `source` and `snapshot` pass through for
-- the homebrew bundle. docs/specs/CONTRACTS.md section 4;
-- docs/decisions/2026-09-26-an-import-is-one-import-lists-transaction.md.
create function public.import_lists(p_lists jsonb)
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
  if p_lists is null or jsonb_typeof(p_lists) <> 'array' or jsonb_array_length(p_lists) > 50 then
    raise exception 'import_lists: not a list of at most 50 lists' using errcode = '22023';
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

revoke execute on function public.import_lists(jsonb) from public, anon;
grant execute on function public.import_lists(jsonb) to authenticated;
