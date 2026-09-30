-- The author's homebrew: sources with sections (homebrew_books) and items
-- (homebrew_items) in the R7 subset of the catalog record shape, each row the
-- owner's own; the two count limits; my_limit() for the account's own
-- display; a list entry that is a reference to an own item or a frozen copy
-- with its snapshot; a share's projection that fills a reference from the
-- live item; one homebrew message per owner per transaction.
-- docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md;
-- docs/decisions/2026-09-30-a-frozen-copy-embeds-its-source-a-reference-must-exist.md.

insert into public.limit_defaults (key, value)
  values ('homebrew_books_per_owner', 20), ('homebrew_items_per_owner', 100);

-- The validators accept and refuse what app/src/lib/homebrew.ts does, over
-- one fixture set (docs/fixtures/homebrew/). A CHECK calls them as the
-- writing role, so authenticated may execute them; anon never. Each check
-- that casts a value stands on its own line after the line that proved its
-- type: Postgres does not promise the order of an `and` chain.
create function public.homebrew_key_ok(p text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select p is not null and p ~ '^hb_[a-z2-7]{16}$';
$$;

-- en and ru: each absent or a string of at most p_max code points with no C0
-- control but tab and newline; at least one holds a non-space character.
create function public.homebrew_names_ok(p jsonb, p_max integer)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_key text;
  v jsonb;
  v_named boolean := false;
begin
  foreach v_key in array array['en', 'ru'] loop
    v := p -> v_key;
    if v is null then
      continue;
    end if;
    if jsonb_typeof(v) <> 'string' then
      return false;
    end if;
    if char_length(v #>> '{}') > p_max then
      return false;
    end if;
    if (v #>> '{}') ~ '[\x01-\x08\x0b-\x1f]' then
      return false;
    end if;
    if (v #>> '{}') ~ '\S' then
      v_named := true;
    end if;
  end loop;
  return v_named;
end;
$$;

create function public.homebrew_text_ok(p jsonb, p_key text, p_max integer)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v jsonb := p -> p_key;
begin
  if v is null then
    return true;
  end if;
  if jsonb_typeof(v) <> 'string' then
    return false;
  end if;
  if char_length(v #>> '{}') > p_max then
    return false;
  end if;
  return (v #>> '{}') !~ '[\x01-\x08\x0b-\x1f]';
end;
$$;

-- An item's stored part: the R7 subset (no eq.line, craft, craft_from, set or
-- refs); docs/decisions/2026-09-30-a-homebrew-item-carries-the-whole-catalog-shape.md.
create function public.homebrew_content_valid(p jsonb)
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
    if (v_eq ->> 'dmg') !~ '^d(4|6|8|10|12|20)(\+([1-9]|1[0-9]|20))?$' then
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
      if (v_alt ->> 'dmg') !~ '^d(4|6|8|10|12|20)(\+([1-9]|1[0-9]|20))?$' then
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

-- A source: a name and at most 30 sections with keys unique in it. Section
-- names unique in the source are a client rule only.
create function public.homebrew_book_valid(p jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v_sections jsonb;
  v_s jsonb;
begin
  if p is null then
    return false;
  end if;
  if jsonb_typeof(p) <> 'object' then
    return false;
  end if;
  if exists (select 1 from jsonb_object_keys(p) as k where k not in ('en', 'ru', 'sections')) then
    return false;
  end if;
  if not public.homebrew_names_ok(p, 80) then
    return false;
  end if;
  if not p ? 'sections' then
    return true;
  end if;
  v_sections := p -> 'sections';
  if jsonb_typeof(v_sections) <> 'array' then
    return false;
  end if;
  if jsonb_array_length(v_sections) > 30 then
    return false;
  end if;
  for v_s in select t.value from jsonb_array_elements(v_sections) as t(value) loop
    if jsonb_typeof(v_s) <> 'object' then
      return false;
    end if;
    if exists (select 1 from jsonb_object_keys(v_s) as k where k not in ('key', 'en', 'ru')) then
      return false;
    end if;
    if jsonb_typeof(v_s -> 'key') is distinct from 'string' then
      return false;
    end if;
    if not public.homebrew_key_ok(v_s ->> 'key') then
      return false;
    end if;
    if not public.homebrew_names_ok(v_s, 80) then
      return false;
    end if;
  end loop;
  return (select count(distinct t.value ->> 'key') from jsonb_array_elements(v_sections) as t(value))
    = jsonb_array_length(v_sections);
end;
$$;

-- The record a frozen copy and a share's projection carry: recordOf() in
-- app/src/lib/homebrew.ts, field for field. p_book is the source's content
-- with its key, or null for the default source.
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

-- A frozen copy's snapshot: what homebrew_snapshot_of() writes for a valid
-- item and source.
create function public.homebrew_snapshot_valid(p jsonb)
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

revoke execute on function public.homebrew_key_ok(text) from public, anon;
revoke execute on function public.homebrew_names_ok(jsonb, integer) from public, anon;
revoke execute on function public.homebrew_text_ok(jsonb, text, integer) from public, anon;
revoke execute on function public.homebrew_content_valid(jsonb) from public, anon;
revoke execute on function public.homebrew_book_valid(jsonb) from public, anon;
revoke execute on function public.homebrew_snapshot_of(text, jsonb, jsonb) from public, anon;
revoke execute on function public.homebrew_snapshot_valid(jsonb) from public, anon;
grant execute on function public.homebrew_key_ok(text) to authenticated;
grant execute on function public.homebrew_names_ok(jsonb, integer) to authenticated;
grant execute on function public.homebrew_text_ok(jsonb, text, integer) to authenticated;
grant execute on function public.homebrew_content_valid(jsonb) to authenticated;
grant execute on function public.homebrew_book_valid(jsonb) to authenticated;
grant execute on function public.homebrew_snapshot_of(text, jsonb, jsonb) to authenticated;
grant execute on function public.homebrew_snapshot_valid(jsonb) to authenticated;

-- The rows go with their user (on delete cascade), which delete_account()
-- relies on; a source's delete keeps its items in the default source.
create table public.homebrew_books (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (public.homebrew_key_ok(key)),
  content jsonb not null check (public.homebrew_book_valid(content)),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key)
);

create table public.homebrew_items (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  key text not null check (public.homebrew_key_ok(key)),
  book_id uuid references public.homebrew_books (id) on delete set null,
  content jsonb not null check (public.homebrew_content_valid(content)),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key)
);

create index homebrew_items_book on public.homebrew_items (book_id);

alter table public.homebrew_books enable row level security;
alter table public.homebrew_items enable row level security;

-- Supabase's default privileges grant every new public table in full to
-- anon and authenticated; the hosted E2E's admin reads and clears the rows.
revoke all on table public.homebrew_books from public, anon, authenticated;
revoke all on table public.homebrew_items from public, anon, authenticated;
grant select, insert, update, delete on table public.homebrew_books to authenticated;
grant select, insert, update, delete on table public.homebrew_items to authenticated;
grant select, delete on table public.homebrew_books, public.homebrew_items to service_role;

create policy homebrew_books_select on public.homebrew_books
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy homebrew_books_insert on public.homebrew_books
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy homebrew_books_update on public.homebrew_books
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy homebrew_books_delete on public.homebrew_books
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy homebrew_items_select on public.homebrew_items
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy homebrew_items_insert on public.homebrew_items
  for insert to authenticated with check (
    (select auth.uid()) = owner_id
    and (book_id is null or exists (
      select 1 from public.homebrew_books b
      where b.id = book_id and b.owner_id = (select auth.uid()))));
create policy homebrew_items_update on public.homebrew_items
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check (
    (select auth.uid()) = owner_id
    and (book_id is null or exists (
      select 1 from public.homebrew_books b
      where b.id = book_id and b.owner_id = (select auth.uid()))));
create policy homebrew_items_delete on public.homebrew_items
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- A key names the row in every list that refers to it, so it never
-- changes; every update is an edit, one step up.
create function public.homebrew_books_before_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.key := old.key;
  new.created_at := old.created_at;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create function public.homebrew_items_before_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.key := old.key;
  new.created_at := old.created_at;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger homebrew_books_before_update before update on public.homebrew_books
  for each row execute function public.homebrew_books_before_update();
create trigger homebrew_items_before_update before update on public.homebrew_items
  for each row execute function public.homebrew_items_before_update();

-- After the insert, as lists_limit: a before trigger would not see the rows
-- its own statement inserted earlier.
create function public.homebrew_books_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('homebrew_books:' || new.owner_id::text));
  v_limit := public.effective_limit(new.owner_id, 'homebrew_books_per_owner');
  if v_limit is not null
     and (select count(*) from public.homebrew_books b where b.owner_id = new.owner_id) > v_limit then
    raise exception 'limit: homebrew_books_per_owner' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create function public.homebrew_items_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('homebrew_items:' || new.owner_id::text));
  v_limit := public.effective_limit(new.owner_id, 'homebrew_items_per_owner');
  if v_limit is not null
     and (select count(*) from public.homebrew_items i where i.owner_id = new.owner_id) > v_limit then
    raise exception 'limit: homebrew_items_per_owner' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create trigger homebrew_books_limit after insert on public.homebrew_books
  for each row execute function public.homebrew_books_limit();
create trigger homebrew_items_limit after insert on public.homebrew_items
  for each row execute function public.homebrew_items_limit();

-- An edit of an item, or of its source, is an edit of every list of the
-- owner that holds a reference to it: a shared page polls the revision.
create function public.homebrew_items_touch()
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

-- A source's delete needs no trigger: on delete set null updates its items,
-- whose own touch bumps the lists.
create function public.homebrew_books_touch()
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

create trigger homebrew_items_touch after update on public.homebrew_items
  for each row execute function public.homebrew_items_touch();
create trigger homebrew_books_touch after update on public.homebrew_books
  for each row execute function public.homebrew_books_touch();

-- A deleted item takes its owner's references with it; a frozen copy in
-- any list keeps its snapshot.
create function public.homebrew_items_before_delete()
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

create trigger homebrew_items_before_delete before delete on public.homebrew_items
  for each row execute function public.homebrew_items_before_delete();

-- One message per owner per transaction, at commit, as lists_broadcast
-- sends per list; the payload names only the tab that wrote.
create function public.homebrew_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := coalesce(new.owner_id, old.owner_id);
  v_done text := coalesce(current_setting('dhloot.hb_broadcast', true), '');
  v_raw text;
  v_by text;
begin
  if strpos(v_done, v_owner::text) > 0 then
    return null;
  end if;
  perform set_config('dhloot.hb_broadcast', v_done || v_owner::text || ',', true);
  begin
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
      jsonb_build_object('by', v_by), 'homebrew', 'owner:' || v_owner::text, true);
  exception when others then
    -- A broadcast never fails the owner's write.
    raise warning 'homebrew_broadcast: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

create constraint trigger homebrew_books_broadcast
  after insert or update or delete on public.homebrew_books
  deferrable initially deferred
  for each row execute function public.homebrew_broadcast();
create constraint trigger homebrew_items_broadcast
  after insert or update or delete on public.homebrew_items
  deferrable initially deferred
  for each row execute function public.homebrew_broadcast();

-- A reference (source homebrew, no snapshot) must name an item the list's
-- owner holds, on every write path; the key share lock makes a concurrent
-- delete of the item wait, then remove the new reference.
create function public.list_entries_reference_exists()
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

revoke execute on function public.homebrew_books_before_update() from public, anon, authenticated;
revoke execute on function public.homebrew_items_before_update() from public, anon, authenticated;
revoke execute on function public.homebrew_books_limit() from public, anon, authenticated;
revoke execute on function public.homebrew_items_limit() from public, anon, authenticated;
revoke execute on function public.homebrew_items_touch() from public, anon, authenticated;
revoke execute on function public.homebrew_books_touch() from public, anon, authenticated;
revoke execute on function public.homebrew_items_before_delete() from public, anon, authenticated;
revoke execute on function public.homebrew_broadcast() from public, anon, authenticated;
revoke execute on function public.list_entries_reference_exists() from public, anon, authenticated;

-- R2's check (an official entry has no snapshot, a homebrew one has one)
-- becomes: an official entry has none; a homebrew entry is a reference
-- (none) or a frozen copy whose snapshot is valid and names the entry's key.
alter table public.list_entries
  drop constraint list_entries_check,
  drop constraint list_entries_snapshot_size;
alter table public.list_entries
  add constraint list_entries_snapshot_source check (source = 'homebrew' or snapshot is null),
  add constraint list_entries_snapshot_valid check (snapshot is null
    or (public.homebrew_snapshot_valid(snapshot) and snapshot ->> 'id' = item_key)),
  add constraint list_entries_snapshot_size
    check (snapshot is null or octet_length(snapshot::text) <= 32768);

-- The signed-in account's own limit, for display only: the database
-- applies every limit itself. docs/decisions/2026-09-30-the-account-reads-its-own-effective-limit.md.
create function public.my_limit(p_key text)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'my_limit: not signed in' using errcode = '28000';
  end if;
  return public.effective_limit(auth.uid(), p_key);
end;
$$;

revoke execute on function public.my_limit(text) from public, anon;
grant execute on function public.my_limit(text) to authenticated;

-- R2's projection, with a reference's snapshot filled from the live item,
-- its source and its section.
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

-- R2's copy, deciding each entry from the source row and not from the
-- projection, which fills a reference's snapshot: a reference stays one
-- only for the list's owner; a frozen entry stays frozen for everyone.
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
