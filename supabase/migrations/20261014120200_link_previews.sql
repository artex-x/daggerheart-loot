-- The two lean reads of the preview host's link cards (preview/worker.mjs):
-- each answers only what one card draws, so an answer stays a few KB at any
-- set size or entry count, and neither shows anything that get_homebrew_item()
-- or get_shared_list() does not show to the same caller. docs/specs/META.md,
-- section 3; docs/decisions/2026-10-14-a-link-preview-reads-a-lean-projection.md.

-- The card of one homebrew item by its id, for anyone who holds the id (signed
-- out too): hid, the item keys the card draws, set_card (the four texts of the
-- record's own set card), img, and three lines (from, into, set) of the
-- related names in p_lang with their counts. The related universe is
-- get_homebrew_item()'s related query - the same predicate, order and limit -
-- held equal to it by tests/db/link-previews.test.mjs. Never the owner, mine,
-- the revision, a time, a source id or a rule card.
create function public.get_item_preview(p_id uuid, p_lang text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.homebrew_items;
  v_record jsonb;
  v_set text;
  v_out jsonb;
  v_lines jsonb;
  v_none constant jsonb := jsonb_build_object('n', 0, 'names', '[]'::jsonb);
begin
  if p_lang is null or p_lang not in ('ru', 'en') then
    raise exception 'get_item_preview: p_lang is ru or en' using errcode = '22023';
  end if;
  if p_id is null then
    return null;
  end if;
  select * into v_item from public.homebrew_items i where i.id = p_id;
  if not found then
    return null;
  end if;
  v_record := public.homebrew_item_record(p_id);
  v_set := case when jsonb_typeof(v_item.content -> 'set') = 'string'
    then nullif(v_item.content ->> 'set', '') end;
  select coalesce(jsonb_object_agg(k.key, v_record -> k.key), '{}'::jsonb) into v_out
    from unnest(array['en', 'ru', 'ende', 'rud', 'eq', 'book', 'set', 'craft', 'craft_from'])
      as k(key)
    where v_record ? k.key;
  -- 1200 is the line cap CAPS.line in preview/worker.mjs: the prefix of names
  -- whose bytes plus 2 for each stays under it holds every name a fold can draw.
  with u as (
    select i.key,
      i.content ->> 'set' as set,
      coalesce(i.content -> 'craft', '[]'::jsonb) as craft,
      coalesce(i.content -> 'craft_from', '[]'::jsonb) as craft_from,
      case when p_lang = 'en'
        then coalesce(nullif(i.content ->> 'en', ''), i.content ->> 'ru', '')
        else coalesce(nullif(i.content ->> 'ru', ''), i.content ->> 'en', '') end as name
    from public.homebrew_items i
    where i.owner_id = v_item.owner_id and i.id <> v_item.id
      and (coalesce(v_item.content -> 'craft', '[]'::jsonb) ? i.key
        or coalesce(v_item.content -> 'craft_from', '[]'::jsonb) ? i.key
        or coalesce(i.content -> 'craft', '[]'::jsonb) ? v_item.key
        or coalesce(i.content -> 'craft_from', '[]'::jsonb) ? v_item.key
        or i.content ->> 'set' = v_item.content ->> 'set'
        or i.content #>> '{eq,line}' = v_item.content #>> '{eq,line}')
    order by lower(coalesce(nullif(i.content ->> 'en', ''), i.content ->> 'ru', '')), i.key
    limit 1000
  ), l as (
    select 'from' as line, u.name, u.key from u
      where coalesce(v_item.content -> 'craft_from', '[]'::jsonb) ? u.key
        or u.craft ? v_item.key
    union all
    select 'into', u.name, u.key from u
      where coalesce(v_item.content -> 'craft', '[]'::jsonb) ? u.key
        or u.craft_from ? v_item.key
    union all
    select 'set', u.name, u.key from u where v_set is not null and u.set = v_set
    union all
    select 'set', v_record ->> p_lang, v_item.key where v_set is not null
  ), r as (
    select l.line, l.name, l.key,
      row_number() over w as ord,
      sum(octet_length(l.name) + 2) over w as used
    from l
    window w as (partition by l.line
      order by (case when p_lang = 'ru' then l.name end) collate "ru-x-icu",
        (case when p_lang = 'en' then l.name end) collate "en-x-icu",
        l.key
      rows between unbounded preceding and current row)
  )
  select coalesce(jsonb_object_agg(g.line, g.o), '{}'::jsonb) into v_lines
    from (
      select r.line, jsonb_build_object(
          'n', count(distinct r.key),
          'names', coalesce(jsonb_agg(to_jsonb(r.name) order by r.ord)
            filter (where r.used <= 1200), '[]'::jsonb)) as o
        from r group by r.line
    ) g;
  return jsonb_build_object(
      'hid', v_item.id,
      'item', v_out,
      'lines', jsonb_build_object(
        'from', coalesce(v_lines -> 'from', v_none),
        'into', coalesce(v_lines -> 'into', v_none),
        'set', coalesce(v_lines -> 'set', v_none)))
    || case when v_set is not null and v_record #> array['cards', 'sets', v_set] is not null
       then jsonb_build_object('set_card', (
         select jsonb_object_agg(k.key, v_record #> array['cards', 'sets', v_set, k.key])
           from unnest(array['en', 'ru', 'ende', 'rud']) as k(key)
           where (v_record #> array['cards', 'sets', v_set]) ? k.key))
       else '{}'::jsonb end
    || case when v_item.art is null then '{}'::jsonb
       else jsonb_build_object('img', v_item.art) end;
end;
$$;

revoke execute on function public.get_item_preview(uuid, text) from public;
grant execute on function public.get_item_preview(uuid, text) to anon, authenticated;

-- The card of one share link, for anyone who holds the token (signed out
-- too): the share's audience, the list name, the first 1000 characters of the
-- players' note and n, the count of the entries that the audience sees - on a
-- players' link the entries without gm_only, on a GM link every entry, as
-- get_shared_list() answers them. Null for the same tokens as
-- get_shared_list(text), checked in the same order. Never the GM note, an
-- entry field, the topic, the revision, the money mode or a price.
create function public.get_shared_list_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_share public.list_shares;
  v_list public.lists;
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
  return jsonb_build_object(
    'audience', v_share.audience,
    'name', v_list.name,
    'note', left(v_list.player_note, 1000),
    'n', (select count(*) from public.list_entries e
      where e.list_id = v_list.id and (v_share.audience = 'gm' or not e.gm_only)));
end;
$$;

revoke execute on function public.get_shared_list_preview(text) from public;
grant execute on function public.get_shared_list_preview(text) to anon, authenticated;
