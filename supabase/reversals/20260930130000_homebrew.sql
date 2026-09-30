-- Undoes 20260930130000_homebrew.sql. It deletes every homebrew source,
-- every homebrew item and every homebrew list entry (references and frozen
-- copies): run it only after a backup (.claude/README.md, "Undo a deploy
-- that carried a migration").
delete from public.list_entries where source = 'homebrew';

drop trigger list_entries_reference_exists on public.list_entries;
drop function public.list_entries_reference_exists();

alter table public.list_entries
  drop constraint list_entries_snapshot_source,
  drop constraint list_entries_snapshot_valid,
  drop constraint list_entries_snapshot_size;
alter table public.list_entries
  add constraint list_entries_check check ((source = 'official') = (snapshot is null)),
  add constraint list_entries_snapshot_size
    check (snapshot is null or octet_length(snapshot::text) <= 16384);

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
            'snapshot', e.snapshot,
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
      id, list_id, item_key, source, snapshot, position, quantity, price_coins,
      player_note, gm_note)
    select
      gen_random_uuid(),
      p_id,
      e ->> 'item_key',
      e ->> 'source',
      nullif(e -> 'snapshot', 'null'::jsonb),
      (e ->> 'position')::integer,
      (e ->> 'quantity')::integer,
      (e ->> 'price_coins')::integer,
      e ->> 'player_note',
      coalesce(e ->> 'gm_note', '')
    from jsonb_array_elements(v_shared -> 'entries') as e;
  return p_id;
end;
$$;

drop function public.my_limit(text);

drop table public.homebrew_items;
drop table public.homebrew_books;

drop function public.homebrew_broadcast();
drop function public.homebrew_items_before_delete();
drop function public.homebrew_books_touch();
drop function public.homebrew_items_touch();
drop function public.homebrew_items_limit();
drop function public.homebrew_books_limit();
drop function public.homebrew_items_before_update();
drop function public.homebrew_books_before_update();
drop function public.homebrew_snapshot_valid(jsonb);
drop function public.homebrew_snapshot_of(text, jsonb, jsonb);
drop function public.homebrew_book_valid(jsonb);
drop function public.homebrew_content_valid(jsonb);
drop function public.homebrew_text_ok(jsonb, text, integer);
drop function public.homebrew_names_ok(jsonb, integer);
drop function public.homebrew_key_ok(text);

delete from public.limit_defaults
  where key in ('homebrew_books_per_owner', 'homebrew_items_per_owner');
