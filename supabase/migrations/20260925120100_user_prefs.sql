-- A signed-in user's UI preferences, one row per user: language,
-- starting section, tables view and print layout (docs/specs/STATE.md,
-- "Account preferences"). The client writes the whole object; the
-- database bounds its shape and size, not its fields. The row goes with
-- its user (on delete cascade), which delete_account() relies on.
create table public.user_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}'::jsonb,
  constraint user_prefs_object check (jsonb_typeof(prefs) = 'object'),
  constraint user_prefs_size check (pg_column_size(prefs) < 4096)
);

alter table public.user_prefs enable row level security;

-- Supabase's default privileges grant every new public table in full to
-- anon and authenticated; TRUNCATE is not governed by row level security.
revoke all on table public.user_prefs from public, anon, authenticated;
grant select, insert, update on table public.user_prefs to authenticated;

create policy user_prefs_select on public.user_prefs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_prefs_insert on public.user_prefs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_prefs_update on public.user_prefs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
