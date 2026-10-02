-- Homebrew travels by file: a name is "named" when it holds a character
-- outside one explicit space class, the same class as app/src/lib/homebrew.ts;
-- import_homebrew() writes a homebrew-v1 file's sources, cards and items in
-- one call; move_homebrew_items() moves items to a source and a section in
-- one call. docs/decisions/2026-10-02-homebrew-import-and-the-bulk-move-are-one-call-each.md;
-- docs/specs/CONTRACTS.md section 4.

-- 20260930130000_homebrew.sql's body with `\S` replaced by the class: JavaScript's
-- `\s` plus U+0085 and U+180E, written with escapes (an editor can drop U+FEFF
-- without a sign). A row valid under it stays valid after a revert.
create or replace function public.homebrew_names_ok(p jsonb, p_max integer)
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
    if (v #>> '{}') ~ '[^\x09-\x0d\x20\u0085\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]' then
      v_named := true;
    end if;
  end loop;
  return v_named;
end;
$$;

-- One file's rows, every row or none. A source row is { id, key, content, names },
-- a card row { id, key, kind, book, content }, an item row { id, key, book, content };
-- `book` is a source key or null. A held key is skipped, or with p_update rewritten;
-- a held row equal to the sent one is not written and counts as skipped. The array
-- bounds are the file's (schema/homebrew-v1.json); they widen in place, never narrow.
create function public.import_homebrew(p_books jsonb, p_cards jsonb, p_items jsonb,
  p_update boolean)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_row jsonb;
  v_s jsonb;
  v_book public.homebrew_books;
  v_card public.homebrew_cards;
  v_item public.homebrew_items;
  v_content jsonb;
  v_sections jsonb;
  v_added boolean;
  v_lang text;
  v_book_id uuid;
  v_book_content jsonb;
  v_books_created integer := 0;
  v_cards_created integer := 0;
  v_cards_updated integer := 0;
  v_cards_skipped integer := 0;
  v_items_created integer := 0;
  v_items_updated integer := 0;
  v_items_skipped integer := 0;
begin
  if auth.uid() is null then
    raise exception 'import_homebrew: not signed in' using errcode = '28000';
  end if;
  if p_update is null
    or jsonb_typeof(p_books) is distinct from 'array'
    or jsonb_typeof(p_cards) is distinct from 'array'
    or jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'import_homebrew: not three arrays and a flag' using errcode = '22023';
  end if;
  if jsonb_array_length(p_books) > 100
    or jsonb_array_length(p_cards) > 1000
    or jsonb_array_length(p_items) > 1000 then
    raise exception 'import_homebrew: more than 100 sources, 1000 cards or 1000 items'
      using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_books || p_cards || p_items) as t(e)
      where jsonb_typeof(t.e) <> 'object') then
    raise exception 'import_homebrew: a row is not an object' using errcode = '22023';
  end if;
  if (select count(distinct t.e ->> 'key') from jsonb_array_elements(p_books) as t(e))
      <> jsonb_array_length(p_books)
    or (select count(distinct t.e ->> 'key') from jsonb_array_elements(p_cards) as t(e))
      <> jsonb_array_length(p_cards)
    or (select count(distinct t.e ->> 'key') from jsonb_array_elements(p_items) as t(e))
      <> jsonb_array_length(p_items) then
    raise exception 'import_homebrew: a key twice in one array' using errcode = '22023';
  end if;

  for v_row in
    select t.e from jsonb_array_elements(p_books) with ordinality as t(e, n) order by t.n
  loop
    select * into v_book from public.homebrew_books b
      where b.owner_id = auth.uid() and b.key = v_row ->> 'key'
      for update;
    if not found then
      insert into public.homebrew_books (id, owner_id, key, content)
        values ((v_row ->> 'id')::uuid, auth.uid(), v_row ->> 'key', v_row -> 'content')
        on conflict (owner_id, key) do nothing;
      if found then
        v_books_created := v_books_created + 1;
        continue;
      end if;
      -- Another tab inserted the key meanwhile: the held path.
      select * into v_book from public.homebrew_books b
        where b.owner_id = auth.uid() and b.key = v_row ->> 'key'
        for update;
    end if;
    v_content := v_book.content;
    v_sections := coalesce(v_content -> 'sections', '[]'::jsonb);
    v_added := false;
    for v_s in
      select t.e from jsonb_array_elements(coalesce(v_row #> '{content,sections}', '[]'::jsonb))
        with ordinality as t(e, n) order by t.n
    loop
      if not exists (select 1 from jsonb_array_elements(v_sections) as h(e)
          where h.e ->> 'key' = v_s ->> 'key') then
        v_sections := v_sections || jsonb_build_array(v_s);
        v_added := true;
      end if;
    end loop;
    if v_added then
      v_content := v_content || jsonb_build_object('sections', v_sections);
    end if;
    if p_update and (v_row -> 'names') = 'true'::jsonb then
      foreach v_lang in array array['en', 'ru'] loop
        if v_row -> 'content' ? v_lang then
          v_content := v_content || jsonb_build_object(v_lang, v_row -> 'content' -> v_lang);
        end if;
      end loop;
    end if;
    if v_content is distinct from v_book.content then
      update public.homebrew_books set content = v_content where id = v_book.id;
    end if;
  end loop;

  for v_row in
    select t.e from jsonb_array_elements(p_cards) with ordinality as t(e, n) order by t.n
  loop
    v_book_id := null;
    if v_row ->> 'book' is not null then
      -- The share lock holds the source until commit: a delete or a section
      -- change made meanwhile waits, so no row lands in a source or section gone.
      select b.id into v_book_id from public.homebrew_books b
        where b.owner_id = auth.uid() and b.key = v_row ->> 'book'
        for share;
      if not found then
        raise exception 'import_homebrew: no source %', v_row ->> 'book' using errcode = '22023';
      end if;
    end if;
    select * into v_card from public.homebrew_cards c
      where c.owner_id = auth.uid() and c.key = v_row ->> 'key'
      for update;
    if not found then
      insert into public.homebrew_cards (id, owner_id, key, kind, book_id, content)
        values ((v_row ->> 'id')::uuid, auth.uid(), v_row ->> 'key', v_row ->> 'kind',
          v_book_id, v_row -> 'content')
        on conflict (owner_id, key) do nothing;
      if found then
        v_cards_created := v_cards_created + 1;
        continue;
      end if;
      select * into v_card from public.homebrew_cards c
        where c.owner_id = auth.uid() and c.key = v_row ->> 'key'
        for update;
    end if;
    if p_update and v_card.kind = v_row ->> 'kind'
      and (v_card.content is distinct from v_row -> 'content'
        or v_card.book_id is distinct from v_book_id) then
      update public.homebrew_cards set content = v_row -> 'content', book_id = v_book_id
        where id = v_card.id;
      v_cards_updated := v_cards_updated + 1;
    else
      v_cards_skipped := v_cards_skipped + 1;
    end if;
  end loop;

  for v_row in
    select t.e from jsonb_array_elements(p_items) with ordinality as t(e, n) order by t.n
  loop
    v_book_id := null;
    v_book_content := null;
    if v_row ->> 'book' is not null then
      select b.id, b.content into v_book_id, v_book_content from public.homebrew_books b
        where b.owner_id = auth.uid() and b.key = v_row ->> 'book'
        for share;
      if not found then
        raise exception 'import_homebrew: no source %', v_row ->> 'book' using errcode = '22023';
      end if;
    end if;
    if v_row #>> '{content,section}' is not null then
      if v_book_id is null then
        raise exception 'import_homebrew: a section with no source' using errcode = '22023';
      end if;
      if not exists (select 1
          from jsonb_array_elements(coalesce(v_book_content -> 'sections', '[]'::jsonb)) as s(e)
          where s.e ->> 'key' = v_row #>> '{content,section}') then
        raise exception 'import_homebrew: no section %', v_row #>> '{content,section}'
          using errcode = '22023';
      end if;
    end if;
    select * into v_item from public.homebrew_items i
      where i.owner_id = auth.uid() and i.key = v_row ->> 'key'
      for update;
    if not found then
      insert into public.homebrew_items (id, owner_id, key, book_id, content)
        values ((v_row ->> 'id')::uuid, auth.uid(), v_row ->> 'key', v_book_id,
          v_row -> 'content')
        on conflict (owner_id, key) do nothing;
      if found then
        v_items_created := v_items_created + 1;
        continue;
      end if;
      select * into v_item from public.homebrew_items i
        where i.owner_id = auth.uid() and i.key = v_row ->> 'key'
        for update;
    end if;
    if p_update
      and (v_item.content is distinct from v_row -> 'content'
        or v_item.book_id is distinct from v_book_id) then
      update public.homebrew_items set content = v_row -> 'content', book_id = v_book_id
        where id = v_item.id;
      v_items_updated := v_items_updated + 1;
    else
      v_items_skipped := v_items_skipped + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'books_created', v_books_created,
    'cards_created', v_cards_created,
    'cards_updated', v_cards_updated,
    'cards_skipped', v_cards_skipped,
    'items_created', v_items_created,
    'items_updated', v_items_updated,
    'items_skipped', v_items_skipped);
end;
$$;

-- Moves items to a source (null: the default) and one of its sections (null:
-- none) in one call, every item or none. Each item names the revision the
-- client read: the server writes only book_id and section from the row as it
-- is, so a move never overwrites an edit made meanwhile. A conflict is a custom
-- P0001, not 40001, which the client would read as a passing fault.
create function public.move_homebrew_items(p_items jsonb, p_book uuid, p_section text)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_row jsonb;
  v_content jsonb;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'move_homebrew_items: not signed in' using errcode = '28000';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'move_homebrew_items: not a list of 1 to 1000 items' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 1000 then
    raise exception 'move_homebrew_items: not a list of 1 to 1000 items' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) as t(e)
      where jsonb_typeof(t.e) <> 'object') then
    raise exception 'move_homebrew_items: an item is not an object' using errcode = '22023';
  end if;
  if (select count(distinct t.e ->> 'id') from jsonb_array_elements(p_items) as t(e))
      <> jsonb_array_length(p_items) then
    raise exception 'move_homebrew_items: an item twice' using errcode = '22023';
  end if;
  if p_section is not null and p_book is null then
    raise exception 'move_homebrew_items: a section with no source' using errcode = '22023';
  end if;
  if p_book is not null then
    select b.content into v_content from public.homebrew_books b where b.id = p_book for share;
    if not found then
      raise exception 'move_homebrew_items: no source' using errcode = 'P0002';
    end if;
    if p_section is not null and not exists (select 1
        from jsonb_array_elements(coalesce(v_content -> 'sections', '[]'::jsonb)) as s(e)
        where s.e ->> 'key' = p_section) then
      raise exception 'move_homebrew_items: no section' using errcode = 'P0002';
    end if;
  end if;
  for v_row in
    select t.e from jsonb_array_elements(p_items) with ordinality as t(e, n) order by t.n
  loop
    update public.homebrew_items i set
        book_id = p_book,
        content = case when p_section is null then i.content - 'section'
          else jsonb_set(i.content, '{section}', to_jsonb(p_section)) end
      where i.id = (v_row ->> 'id')::uuid and i.revision = (v_row ->> 'revision')::bigint;
    if not found then
      raise exception 'move_homebrew_items: conflict %', v_row ->> 'id' using errcode = 'P0001';
    end if;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.import_homebrew(jsonb, jsonb, jsonb, boolean) from public, anon;
revoke execute on function public.move_homebrew_items(jsonb, uuid, text) from public, anon;
grant execute on function public.import_homebrew(jsonb, jsonb, jsonb, boolean) to authenticated;
grant execute on function public.move_homebrew_items(jsonb, uuid, text) to authenticated;
