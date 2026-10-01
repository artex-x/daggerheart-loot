-- Undoes 20261001130000_homebrew_relations.sql. It deletes every homebrew
-- card. It fails while a frozen copy is larger than 32768 bytes, and after it
-- the narrowed validators refuse every UPDATE of an item that names a
-- relation and of a list entry whose snapshot holds cards: run it only after
-- a read finds none (.claude/README.md, "Undo a deploy that carried a migration").
alter table public.list_entries
  drop constraint list_entries_snapshot_size,
  add constraint list_entries_snapshot_size
    check (snapshot is null or octet_length(snapshot::text) <= 32768);

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
                    then null else b.content || jsonb_build_object('key', b.key) end)
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

drop table public.homebrew_cards;
drop function public.homebrew_cards_touch();
drop function public.homebrew_cards_limit();
drop function public.homebrew_cards_before_update();

alter table public.homebrew_items drop constraint homebrew_items_relations_not_self;

create or replace function public.homebrew_snapshot_valid(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v jsonb;
  v_book jsonb;
  v_section jsonb;
begin
  if p is null then
    return false;
  end if;
  if jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if (p -> 'src' = '"homebrew"'::jsonb) is not true then
    return false;
  end if;
  if jsonb_typeof(p -> 'id') is distinct from 'string' then
    return false;
  end if;
  if not public.homebrew_key_ok(p ->> 'id') then
    return false;
  end if;
  if p ? 'book' then
    v_book := p -> 'book';
    if jsonb_typeof(v_book) <> 'object' then
      return false;
    end if;
    if exists (select 1 from jsonb_object_keys(v_book) as k
        where k not in ('key', 'en', 'ru', 'section')) then
      return false;
    end if;
    if jsonb_typeof(v_book -> 'key') is distinct from 'string' then
      return false;
    end if;
    if not public.homebrew_key_ok(v_book ->> 'key') then
      return false;
    end if;
    if not public.homebrew_names_ok(v_book, 80) then
      return false;
    end if;
    if v_book ? 'section' then
      v_section := v_book -> 'section';
      if jsonb_typeof(v_section) <> 'object' then
        return false;
      end if;
      if exists (select 1 from jsonb_object_keys(v_section) as k
          where k not in ('key', 'en', 'ru')) then
        return false;
      end if;
      if jsonb_typeof(v_section -> 'key') is distinct from 'string' then
        return false;
      end if;
      if not public.homebrew_key_ok(v_section ->> 'key') then
        return false;
      end if;
      if not public.homebrew_names_ok(v_section, 80) then
        return false;
      end if;
    end if;
  end if;
  v := p - 'id' - 'src' - 'book';
  if v ->> 'kind' = 'equip' and v ? 'tier' then
    if (v -> 'tier' = '"A"'::jsonb) is not true then
      return false;
    end if;
    if (v #>> '{eq,tier}') is distinct from 'A' then
      return false;
    end if;
    v := v - 'tier';
  end if;
  return public.homebrew_content_valid(v);
end;
$$;

drop function public.homebrew_snapshot_of(text, jsonb, jsonb, jsonb);
create function public.homebrew_snapshot_of(p_key text, p_content jsonb, p_book jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_out jsonb;
  v_book jsonb;
  v_section jsonb;
begin
  v_out := (p_content - 'section') || jsonb_build_object(
    'id', p_key,
    'src', 'homebrew',
    'en', coalesce(nullif(p_content ->> 'en', ''), p_content ->> 'ru', ''),
    'ru', coalesce(nullif(p_content ->> 'ru', ''), p_content ->> 'en', ''),
    'ende', coalesce(nullif(p_content ->> 'ende', ''), p_content ->> 'rud', ''),
    'rud', coalesce(nullif(p_content ->> 'rud', ''), p_content ->> 'ende', ''));
  if p_content #>> '{eq,tier}' = 'A' then
    v_out := v_out || jsonb_build_object('tier', 'A');
  end if;
  if p_book is null then
    return v_out;
  end if;
  v_book := jsonb_build_object(
    'key', p_book ->> 'key',
    'en', coalesce(nullif(p_book ->> 'en', ''), p_book ->> 'ru', ''),
    'ru', coalesce(nullif(p_book ->> 'ru', ''), p_book ->> 'en', ''));
  select t.value into v_section
    from jsonb_array_elements(coalesce(p_book -> 'sections', '[]'::jsonb)) as t(value)
    where t.value ->> 'key' = p_content ->> 'section'
    limit 1;
  if v_section is not null then
    v_book := v_book || jsonb_build_object('section', jsonb_build_object(
      'key', v_section ->> 'key',
      'en', coalesce(nullif(v_section ->> 'en', ''), v_section ->> 'ru', ''),
      'ru', coalesce(nullif(v_section ->> 'ru', ''), v_section ->> 'en', '')));
  end if;
  return v_out || jsonb_build_object('book', v_book);
end;
$$;

revoke execute on function public.homebrew_snapshot_of(text, jsonb, jsonb) from public, anon;
grant execute on function public.homebrew_snapshot_of(text, jsonb, jsonb) to authenticated;

create or replace function public.homebrew_content_valid(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_kind text;
  v_eq jsonb;
  v_t text;
  v_alt jsonb;
  v_th jsonb;
begin
  if p is null then
    return false;
  end if;
  if jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if exists (select 1 from jsonb_object_keys(p) as k
      where k not in ('kind', 'en', 'ru', 'ende', 'rud', 'tier', 'eq', 'section')) then
    return false;
  end if;
  if jsonb_typeof(p -> 'kind') is distinct from 'string' then
    return false;
  end if;
  v_kind := p ->> 'kind';
  if v_kind not in ('item', 'consumable', 'equip') then
    return false;
  end if;
  if not public.homebrew_names_ok(p, 120) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'ende', 3000) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'rud', 3000) then
    return false;
  end if;
  if p ? 'section' then
    if jsonb_typeof(p -> 'section') is distinct from 'string' then
      return false;
    end if;
    if not public.homebrew_key_ok(p ->> 'section') then
      return false;
    end if;
  end if;
  if (v_kind = 'equip') <> (p ? 'eq') then
    return false;
  end if;
  if p ? 'tier' then
    if v_kind = 'equip' then
      return false;
    end if;
    if (p -> 'tier' = any (array['1', '2', '3', '4', '"A"', '"C"']::jsonb[])) is not true then
      return false;
    end if;
  end if;
  if v_kind <> 'equip' then
    return true;
  end if;
  v_eq := p -> 'eq';
  if jsonb_typeof(v_eq) <> 'object' then
    return false;
  end if;
  if exists (select 1 from jsonb_object_keys(v_eq) as k
      where k not in ('t', 'tier', 'cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'as', 'th', 'alt')) then
    return false;
  end if;
  if (v_eq -> 't' = any (array['"weapon"', '"secondary"', '"armor"']::jsonb[])) is not true then
    return false;
  end if;
  if (v_eq -> 'tier' = any (array['1', '2', '3', '4', '"A"']::jsonb[])) is not true then
    return false;
  end if;
  v_t := v_eq ->> 't';
  if v_t in ('weapon', 'secondary') then
    if (v_eq -> 'cls' = any (array['"phy"', '"mag"']::jsonb[])) is not true then
      return false;
    end if;
    if (v_eq -> 'tr' = any (array['"agility"', '"strength"', '"finesse"', '"instinct"',
        '"presence"', '"knowledge"', '"spellcast"']::jsonb[])) is not true then
      return false;
    end if;
    if (v_eq -> 'rg' = any (array['"melee"', '"veryclose"', '"close"', '"far"',
        '"veryfar"']::jsonb[])) is not true then
      return false;
    end if;
    if jsonb_typeof(v_eq -> 'dmg') is distinct from 'string' then
      return false;
    end if;
    if (v_eq ->> 'dmg') !~ '^d(4|6|8|10|12|20)(\+[1-9][0-9]?)?$' then
      return false;
    end if;
    if (v_eq -> 'dt' = any (array['"phy"', '"mag"', '"any"']::jsonb[])) is not true then
      return false;
    end if;
    if (v_eq -> 'bu' = any (array['1', '2', '"any"']::jsonb[])) is not true then
      return false;
    end if;
    if v_eq ? 'as' or v_eq ? 'th' then
      return false;
    end if;
    if v_eq ? 'alt' then
      v_alt := v_eq -> 'alt';
      if jsonb_typeof(v_alt) is distinct from 'object' then
        return false;
      end if;
      if exists (select 1 from jsonb_object_keys(v_alt) as k
          where k not in ('tr', 'rg', 'dmg', 'dt')) then
        return false;
      end if;
      if (v_alt -> 'tr' = any (array['"agility"', '"strength"', '"finesse"', '"instinct"',
          '"presence"', '"knowledge"', '"spellcast"']::jsonb[])) is not true then
        return false;
      end if;
      if (v_alt -> 'rg' = any (array['"melee"', '"veryclose"', '"close"', '"far"',
          '"veryfar"']::jsonb[])) is not true then
        return false;
      end if;
      if jsonb_typeof(v_alt -> 'dmg') is distinct from 'string' then
        return false;
      end if;
      if (v_alt ->> 'dmg') !~ '^d(4|6|8|10|12|20)(\+[1-9][0-9]?)?$' then
        return false;
      end if;
      if (v_alt -> 'dt' = any (array['"phy"', '"mag"', '"any"']::jsonb[])) is not true then
        return false;
      end if;
    end if;
    return true;
  end if;
  if v_eq ?| array['cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'alt'] then
    return false;
  end if;
  if jsonb_typeof(v_eq -> 'as') is distinct from 'number' then
    return false;
  end if;
  if ((v_eq -> 'as') #>> '{}')::numeric <> trunc(((v_eq -> 'as') #>> '{}')::numeric) then
    return false;
  end if;
  if ((v_eq -> 'as') #>> '{}')::numeric not between 0 and 12 then
    return false;
  end if;
  v_th := v_eq -> 'th';
  if jsonb_typeof(v_th) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(v_th) <> 2 then
    return false;
  end if;
  if jsonb_typeof(v_th -> 0) is distinct from 'number' then
    return false;
  end if;
  if ((v_th -> 0) #>> '{}')::numeric <> trunc(((v_th -> 0) #>> '{}')::numeric) then
    return false;
  end if;
  if ((v_th -> 0) #>> '{}')::numeric not between 1 and 99 then
    return false;
  end if;
  if jsonb_typeof(v_th -> 1) is distinct from 'number' then
    return false;
  end if;
  if ((v_th -> 1) #>> '{}')::numeric <> trunc(((v_th -> 1) #>> '{}')::numeric) then
    return false;
  end if;
  if ((v_th -> 1) #>> '{}')::numeric not between 1 and 99 then
    return false;
  end if;
  return (v_th ->> 0)::numeric < (v_th ->> 1)::numeric;
end;
$$;

drop function public.homebrew_card_valid(text, jsonb);
drop function public.homebrew_ids_ok(jsonb, text, integer);

delete from public.limit_defaults where key = 'homebrew_cards_per_owner';
