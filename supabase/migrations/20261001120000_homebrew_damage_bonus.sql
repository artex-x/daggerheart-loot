-- Widens the flat damage bonus of homebrew_content_valid() from +1..+20 to
-- +1..+99; the rest of the body is 20260930130000_homebrew.sql's.
-- docs/specs/FEATURES.md, "Homebrew".
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

revoke execute on function public.homebrew_content_valid(jsonb) from public, anon;
grant execute on function public.homebrew_content_valid(jsonb) to authenticated;
