-- An own set card or rule card holds book items: content.items, 1-100 unique
-- catalog record ids, never an hb_ key (an own item names the card itself).
-- Only the account that owns the card applies it. A change of the book items
-- alone changes no linked item's record, so it bumps no list and writes no
-- notice. docs/specs/FEATURES.md, "Homebrew", "Cards";
-- docs/decisions/2026-10-08-an-own-card-holds-book-items-the-owner-sees-them.md.

-- 20261001130000_homebrew_relations.sql's body with items.
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
    v_keys := array['en', 'ru', 'ende', 'rud', 'items'];
  elsif p_kind = 'ref' then
    v_keys := array['en', 'ru', 'ensub', 'rusub', 'ende', 'rud', 'url', 'items'];
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
  if not public.homebrew_ids_ok(p, 'items', 100) then
    return false;
  end if;
  if exists (select 1 from jsonb_array_elements_text(coalesce(p -> 'items', '[]'::jsonb)) as t(id)
             where public.homebrew_key_ok(t.id)) then
    return false;
  end if;
  return true;
end;
$$;

revoke execute on function public.homebrew_card_valid(text, jsonb) from public, anon;
grant execute on function public.homebrew_card_valid(text, jsonb) to authenticated;

-- 20261007130000_homebrew_links.sql's body with the early return.
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
  -- A change of the official members alone changes no linked item's record.
  if tg_op = 'UPDATE' and (old.content - 'items') = (new.content - 'items')
     and old.book_id is not distinct from new.book_id then
    return null;
  end if;
  perform public.homebrew_links_touch(array(
    select i.id from public.homebrew_items i
    where i.owner_id = v_owner
      and (i.content ->> 'set' = v_key
        or coalesce(i.content -> 'refs', '[]'::jsonb) ? v_key)), 'changed');
  return null;
end;
$$;

revoke execute on function public.homebrew_cards_touch() from public, anon, authenticated;
