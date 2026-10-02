-- Undoes 20261002130000_homebrew_files.sql: drops the import and move calls
-- (an older frontend never calls them) and restores the `\S` name check, under
-- which every name the class accepts stays valid.
drop function public.move_homebrew_items(jsonb, uuid, text);
drop function public.import_homebrew(jsonb, jsonb, jsonb, boolean);

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
    if (v #>> '{}') ~ '\S' then
      v_named := true;
    end if;
  end loop;
  return v_named;
end;
$$;
