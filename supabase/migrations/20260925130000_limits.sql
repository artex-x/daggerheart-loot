-- Count limits as rows: limit_defaults holds one value per key, and
-- user_limit_overrides raises or lowers it for one user (a missing row is
-- the default, a null value no limit). Only security definer functions
-- read them: no grant to anon or authenticated. `npm run limits:set`
-- edits an override. docs/specs/FEATURES.md, "Lists"; docs/DECISIONS.md,
-- 2026-09-25, "Count limits are rows read by `effective_limit()`".
create table public.limit_defaults (
  key text primary key,
  value integer check (value is null or value >= 0)
);

create table public.user_limit_overrides (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null references public.limit_defaults (key) on delete cascade,
  value integer check (value is null or value >= 0),
  primary key (user_id, key)
);

alter table public.limit_defaults enable row level security;
alter table public.user_limit_overrides enable row level security;

-- Supabase's default privileges grant every new public table in full to
-- anon and authenticated.
revoke all on table public.limit_defaults from public, anon, authenticated;
revoke all on table public.user_limit_overrides from public, anon, authenticated;

-- A later release inserts its own keys in its own migration.
insert into public.limit_defaults (key, value)
  values ('lists_per_owner', 50), ('entries_per_list', 100);

-- Raises for a key not in limit_defaults, so a typo never reads as no limit.
create function public.effective_limit(p_user uuid, p_key text)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_default integer;
  v_override integer;
begin
  select d.value into v_default from public.limit_defaults d where d.key = p_key;
  if not found then
    raise exception 'effective_limit: unknown limit key %', p_key using errcode = '22023';
  end if;
  select o.value into v_override
    from public.user_limit_overrides o
    where o.user_id = p_user and o.key = p_key;
  if found then
    return v_override;
  end if;
  return v_default;
end;
$$;

revoke execute on function public.effective_limit(uuid, text) from public, anon, authenticated;
