-- An item names its relations (craft, craft_from, set, refs, eq.line),
-- the author holds set cards and rule cards (homebrew_cards), and a frozen
-- copy carries the own cards its item names, up to 131072 bytes.
-- docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md;
-- docs/decisions/2026-10-01-a-frozen-copy-holds-up-to-131072-bytes.md.

insert into public.limit_defaults (key, value) values ('homebrew_cards_per_owner', 100);

-- A list of record ids: absent, or 1..p_max unique strings of a list entry
-- key's shape. Whether a key resolves is never checked: it draws or not.
create function public.homebrew_ids_ok(p jsonb, p_key text, p_max integer)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v jsonb := p -> p_key;
  v_id jsonb;
begin
  if v is null then
    return true;
  end if;
  if jsonb_typeof(v) <> 'array' then
    return false;
  end if;
  if jsonb_array_length(v) < 1 or jsonb_array_length(v) > p_max then
    return false;
  end if;
  for v_id in select t.value from jsonb_array_elements(v) as t(value) loop
    if jsonb_typeof(v_id) <> 'string' then
      return false;
    end if;
    if (v_id #>> '{}') !~ '^[A-Za-z0-9_-]{1,64}$' then
      return false;
    end if;
  end loop;
  return (select count(distinct t.value) from jsonb_array_elements(v) as t(value))
    = jsonb_array_length(v);
end;
$$;

-- A set card's or a rule card's stored part for its kind: one name of at
-- most 80 code points, texts of at most 1500, a rule card's subtitles of at
-- most 60 and its link empty or https:// and printable ASCII, at most 300.
create function public.homebrew_card_valid(p_kind text, p jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_keys text[];
begin
  if p is null then
    return false;
  end if;
  if jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if p_kind = 'set' then
    v_keys := array['en', 'ru', 'ende', 'rud'];
  elsif p_kind = 'ref' then
    v_keys := array['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url'];
  else
    return false;
  end if;
  if exists (select 1 from jsonb_object_keys(p) as k where k <> all (v_keys)) then
    return false;
  end if;
  if not public.homebrew_names_ok(p, 80) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'ensub', 60) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'rusub', 60) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'ende', 1500) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'rud', 1500) then
    return false;
  end if;
  if not public.homebrew_text_ok(p, 'url', 300) then
    return false;
  end if;
  if p ? 'url' then
    if (p ->> 'url') !~ '^(https://[\x21-\x7e]+)?$' then
      return false;
    end if;
  end if;
  return true;
end;
$$;

-- 20261001120000_homebrew_damage_bonus.sql's body with the relation keys.
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
      where k not in ('kind', 'en', 'ru', 'ende', 'rud', 'tier', 'eq', 'section',
        'craft', 'craft_from', 'set', 'refs')) then
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
  if not public.homebrew_ids_ok(p, 'craft', 8) then
    return false;
  end if;
  if not public.homebrew_ids_ok(p, 'craft_from', 8) then
    return false;
  end if;
  if p ? 'set' then
    if jsonb_typeof(p -> 'set') is distinct from 'string' then
      return false;
    end if;
    if (p ->> 'set') !~ '^[A-Za-z0-9_-]{1,64}$' then
      return false;
    end if;
  end if;
  if not public.homebrew_ids_ok(p, 'refs', 3) then
    return false;
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
      where k not in ('t', 'tier', 'cls', 'tr', 'rg', 'dmg', 'dt', 'bu', 'as', 'th', 'alt',
        'line')) then
    return false;
  end if;
  if (v_eq -> 't' = any (array['"weapon"', '"secondary"', '"armor"']::jsonb[])) is not true then
    return false;
  end if;
  if (v_eq -> 'tier' = any (array['1', '2', '3', '4', '"A"']::jsonb[])) is not true then
    return false;
  end if;
  if v_eq ? 'line' then
    if jsonb_typeof(v_eq -> 'line') is distinct from 'string' then
      return false;
    end if;
    if (v_eq ->> 'line') !~ '^[A-Za-z0-9_-]{1,64}$' then
      return false;
    end if;
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

drop function public.homebrew_snapshot_of(text, jsonb, jsonb);

-- The record a frozen copy and a share's projection carry: recordOf() in
-- app/src/lib/homebrew.ts, field for field. p_book is the source's content
-- with its key, or null for the default source; p_cards is the owner's
-- cards, each content with its key and kind, or null. Only the set card and
-- the rule cards the item names are embedded, in the catalog's card shape.
create function public.homebrew_snapshot_of(p_key text, p_content jsonb, p_book jsonb,
  p_cards jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_out jsonb;
  v_book jsonb;
  v_section jsonb;
  v_card jsonb;
  v_sets jsonb := '{}'::jsonb;
  v_refs jsonb := '{}'::jsonb;
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
  for v_card in select t.value from jsonb_array_elements(coalesce(p_cards, '[]'::jsonb)) as t(value)
  loop
    if v_card ->> 'kind' = 'set' and v_card ->> 'key' = p_content ->> 'set' then
      v_sets := v_sets || jsonb_build_object(v_card ->> 'key', jsonb_build_object(
        'en', coalesce(nullif(v_card ->> 'en', ''), v_card ->> 'ru', ''),
        'ru', coalesce(nullif(v_card ->> 'ru', ''), v_card ->> 'en', ''),
        'ende', coalesce(nullif(v_card ->> 'ende', ''), v_card ->> 'rud', ''),
        'rud', coalesce(nullif(v_card ->> 'rud', ''), v_card ->> 'ende', '')));
    elsif v_card ->> 'kind' = 'ref'
        and (coalesce(p_content -> 'refs', '[]'::jsonb) ? (v_card ->> 'key')) then
      v_refs := v_refs || jsonb_build_object(v_card ->> 'key', jsonb_build_object(
        'en', coalesce(nullif(v_card ->> 'en', ''), v_card ->> 'ru', ''),
        'ru', coalesce(nullif(v_card ->> 'ru', ''), v_card ->> 'en', ''),
        'ensub', coalesce(nullif(v_card ->> 'ensub', ''), v_card ->> 'rusub', ''),
        'rusub', coalesce(nullif(v_card ->> 'rusub', ''), v_card ->> 'ensub', ''),
        'ende', coalesce(nullif(v_card ->> 'ende', ''), v_card ->> 'rud', ''),
        'rud', coalesce(nullif(v_card ->> 'rud', ''), v_card ->> 'ende', ''),
        'url', coalesce(v_card ->> 'url', '')));
    end if;
  end loop;
  if v_sets <> '{}'::jsonb or v_refs <> '{}'::jsonb then
    v_out := v_out || jsonb_build_object('cards',
      (case when v_sets = '{}'::jsonb then '{}'::jsonb
        else jsonb_build_object('sets', v_sets) end)
      || (case when v_refs = '{}'::jsonb then '{}'::jsonb
        else jsonb_build_object('refs', v_refs) end));
  end if;
  if p_book is null then
    return v_out;
  end if;
  -- from here to the end: 20260930130000_homebrew.sql's body, unchanged
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

-- A frozen copy's snapshot: what homebrew_snapshot_of() writes for a valid
-- item, source and cards.
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
  v_cards jsonb;
  v_key text;
  v_card jsonb;
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
  if p ? 'cards' then
    v_cards := p -> 'cards';
    if jsonb_typeof(v_cards) <> 'object' then
      return false;
    end if;
    if exists (select 1 from jsonb_object_keys(v_cards) as k where k not in ('sets', 'refs')) then
      return false;
    end if;
    if v_cards ? 'sets' then
      if jsonb_typeof(v_cards -> 'sets') <> 'object' then
        return false;
      end if;
      for v_key, v_card in select t.key, t.value from jsonb_each(v_cards -> 'sets') as t loop
        if v_key is distinct from p ->> 'set' then
          return false;
        end if;
        if not public.homebrew_key_ok(v_key) then
          return false;
        end if;
        if not public.homebrew_card_valid('set', v_card) then
          return false;
        end if;
      end loop;
    end if;
    if v_cards ? 'refs' then
      if jsonb_typeof(v_cards -> 'refs') <> 'object' then
        return false;
      end if;
      for v_key, v_card in select t.key, t.value from jsonb_each(v_cards -> 'refs') as t loop
        if (coalesce(p -> 'refs', '[]'::jsonb) ? v_key) is not true then
          return false;
        end if;
        if not public.homebrew_key_ok(v_key) then
          return false;
        end if;
        if not public.homebrew_card_valid('ref', v_card) then
          return false;
        end if;
      end loop;
    end if;
  end if;
  v := p - 'id' - 'src' - 'book' - 'cards';
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

revoke execute on function public.homebrew_ids_ok(jsonb, text, integer) from public, anon;
revoke execute on function public.homebrew_card_valid(text, jsonb) from public, anon;
revoke execute on function public.homebrew_snapshot_of(text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.homebrew_ids_ok(jsonb, text, integer) to authenticated;
grant execute on function public.homebrew_card_valid(text, jsonb) to authenticated;
grant execute on function public.homebrew_snapshot_of(text, jsonb, jsonb, jsonb) to authenticated;

-- An item never names itself in craft or craft_from: the key is a column,
-- so this is the table's check and not homebrew_content_valid()'s.
alter table public.homebrew_items
  add constraint homebrew_items_relations_not_self check (
    not (coalesce(content -> 'craft', '[]'::jsonb) ? key)
    and not (coalesce(content -> 'craft_from', '[]'::jsonb) ? key));

-- The author's set cards and rule cards, each row its owner's, as
-- homebrew_items; the kind never changes after the insert. A card's delete
-- leaves its key on the items, which then draw nothing for it.
create table public.homebrew_cards (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (public.homebrew_key_ok(key)),
  kind text not null check (kind in ('set', 'ref')),
  book_id uuid references public.homebrew_books (id) on delete set null,
  content jsonb not null,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key),
  constraint homebrew_cards_content_check check (public.homebrew_card_valid(kind, content))
);

create index homebrew_cards_book on public.homebrew_cards (book_id);

alter table public.homebrew_cards enable row level security;

revoke all on table public.homebrew_cards from public, anon, authenticated;
grant select, insert, update, delete on table public.homebrew_cards to authenticated;
grant select, delete on table public.homebrew_cards to service_role;

create policy homebrew_cards_select on public.homebrew_cards
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy homebrew_cards_insert on public.homebrew_cards
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and (book_id is null or exists (
      select 1 from public.homebrew_books b
      where b.id = book_id and b.owner_id = (select auth.uid()))));
create policy homebrew_cards_update on public.homebrew_cards
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (book_id is null or exists (
      select 1 from public.homebrew_books b
      where b.id = book_id and b.owner_id = (select auth.uid()))));
create policy homebrew_cards_delete on public.homebrew_cards
  for delete to authenticated using ((select auth.uid()) = owner_id);

create function public.homebrew_cards_before_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.key := old.key;
  new.kind := old.kind;
  new.created_at := old.created_at;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create function public.homebrew_cards_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('homebrew_cards:' || new.owner_id::text));
  v_limit := public.effective_limit(new.owner_id, 'homebrew_cards_per_owner');
  if v_limit is not null
     and (select count(*) from public.homebrew_cards c where c.owner_id = new.owner_id) > v_limit then
    raise exception 'limit: homebrew_cards_per_owner' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

-- A card's write is an edit of every list of the owner that holds a
-- reference to an item naming the card: a share's projection embeds it.
create function public.homebrew_cards_touch()
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

create trigger homebrew_cards_before_update before update on public.homebrew_cards
  for each row execute function public.homebrew_cards_before_update();
create trigger homebrew_cards_limit after insert on public.homebrew_cards
  for each row execute function public.homebrew_cards_limit();
create trigger homebrew_cards_touch after insert or update or delete on public.homebrew_cards
  for each row execute function public.homebrew_cards_touch();
create constraint trigger homebrew_cards_broadcast
  after insert or update or delete on public.homebrew_cards
  deferrable initially deferred
  for each row execute function public.homebrew_broadcast();

revoke execute on function public.homebrew_cards_before_update() from public, anon, authenticated;
revoke execute on function public.homebrew_cards_limit() from public, anon, authenticated;
revoke execute on function public.homebrew_cards_touch() from public, anon, authenticated;

-- docs/decisions/2026-10-01-a-frozen-copy-holds-up-to-131072-bytes.md.
alter table public.list_entries
  drop constraint list_entries_snapshot_size,
  add constraint list_entries_snapshot_size
    check (snapshot is null or octet_length(snapshot::text) <= 131072);

-- 20260930130000_homebrew.sql's projection, with the owner's cards that the
-- item names passed to homebrew_snapshot_of().
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
