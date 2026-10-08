-- Undoes 20261008120000_homebrew_card_items.sql: strips every card's book
-- items (the previous validator refuses the key), then restores
-- homebrew_card_valid() from 20261001130000_homebrew_relations.sql and
-- homebrew_cards_touch() from 20261007130000_homebrew_links.sql. The book
-- items are lost; to keep them, export a homebrew-v2 file before this runs
-- and import it once the migration is applied again (the previous bundle
-- refuses version 2):
-- docs/decisions/2026-10-08-an-own-card-holds-book-items-the-owner-sees-them.md.
update public.homebrew_cards set content = content - 'items' where content ? 'items';

create or replace function public.homebrew_card_valid(p_kind text, p jsonb)
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

create or replace function public.homebrew_cards_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid := coalesce(new.owner_id, old.owner_id);
  v_key text := coalesce(new.key, old.key);
begin
  perform public.homebrew_links_touch(array(
    select i.id from public.homebrew_items i
    where i.owner_id = v_owner
      and (i.content ->> 'set' = v_key
        or coalesce(i.content -> 'refs', '[]'::jsonb) ? v_key)), 'changed');
  return null;
end;
$$;
