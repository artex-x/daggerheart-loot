-- A signed-in owner's cloud lists and their entries. The client makes the
-- ids; the owner reads and writes only its own rows (row level security);
-- every entry change bumps its list's revision and updated_at, which the
-- lists index sorts by and a shared page polls. The rows go with their
-- user (on delete cascade), which delete_account() relies on.
-- docs/specs/FEATURES.md, "Lists".
create table public.lists (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '' check (char_length(name) <= 200),
  money_mode text not null default 'bag' check (money_mode in ('bag', 'coin')),
  player_note text not null default '' check (char_length(player_note) <= 4000),
  gm_note text not null default '' check (char_length(gm_note) <= 4000),
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lists_owner_updated on public.lists (owner_id, updated_at desc);

-- No unique position: readers order by (position, id), and two devices
-- racing a reorder may leave a duplicate (last write wins).
create table public.list_entries (
  id uuid primary key,
  list_id uuid not null references public.lists (id) on delete cascade,
  item_key text not null check (item_key ~ '^[A-Za-z0-9_-]{1,64}$'),
  source text not null default 'official' check (source in ('official', 'homebrew')),
  snapshot jsonb check ((source = 'official') = (snapshot is null))
    constraint list_entries_snapshot_size
      check (snapshot is null or octet_length(snapshot::text) <= 16384),
  position integer not null check (position >= 0),
  quantity integer not null default 1 check (quantity between 1 and 99),
  price_coins integer check (price_coins is null or price_coins between 1 and 99999),
  player_note text not null default '' check (char_length(player_note) <= 4000),
  gm_note text not null default '' check (char_length(gm_note) <= 4000),
  unique (list_id, item_key)
);

create index list_entries_list_position on public.list_entries (list_id, position);

alter table public.lists enable row level security;
alter table public.list_entries enable row level security;

-- Supabase's default privileges grant every new public table in full to
-- anon and authenticated; TRUNCATE is not governed by row level security.
revoke all on table public.lists from public, anon, authenticated;
revoke all on table public.list_entries from public, anon, authenticated;
grant select, insert, update, delete on table public.lists to authenticated;
grant select, insert, update, delete on table public.list_entries to authenticated;

create policy lists_select on public.lists
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy lists_insert on public.lists
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy lists_update on public.lists
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy lists_delete on public.lists
  for delete to authenticated using ((select auth.uid()) = owner_id);

create policy list_entries_select on public.list_entries
  for select to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));
create policy list_entries_insert on public.list_entries
  for insert to authenticated with check (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));
create policy list_entries_update on public.list_entries
  for update to authenticated
  using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())))
  with check (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));
create policy list_entries_delete on public.list_entries
  for delete to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));

-- A client cannot move a list, rewrite its creation time or set its
-- revision; every update is an edit, one step up. It touches only the row
-- in hand, so it runs as the caller.
create function public.lists_before_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.id := old.id;
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger lists_before_update before update on public.lists
  for each row execute function public.lists_before_update();

-- An entry change is an edit of its list, and of the list it left.
create function public.list_entries_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.lists set revision = revision + 1, updated_at = now()
    where id in (new.list_id, old.list_id);
  return null;
end;
$$;

create trigger list_entries_touch after insert or update or delete on public.list_entries
  for each row execute function public.list_entries_touch();

-- After, not before, the insert: a before trigger does not see the rows
-- inserted earlier by its own statement, so one multi-row insert would
-- pass the limit. The lock orders two sessions of one owner.
create function public.lists_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('lists:' || new.owner_id::text));
  v_limit := public.effective_limit(new.owner_id, 'lists_per_owner');
  if v_limit is not null
     and (select count(*) from public.lists l where l.owner_id = new.owner_id) > v_limit then
    raise exception 'limit: lists_per_owner' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create trigger lists_limit after insert on public.lists
  for each row execute function public.lists_limit();

-- Also on a move to another list, which is an insert into that list.
create function public.list_entries_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_limit integer;
begin
  if tg_op = 'UPDATE' and new.list_id = old.list_id then
    return null;
  end if;
  perform pg_advisory_xact_lock(hashtext('entries:' || new.list_id::text));
  select l.owner_id into v_owner from public.lists l where l.id = new.list_id;
  v_limit := public.effective_limit(v_owner, 'entries_per_list');
  if v_limit is not null
     and (select count(*) from public.list_entries e where e.list_id = new.list_id) > v_limit then
    raise exception 'limit: entries_per_list' using errcode = 'P0001', detail = v_limit::text;
  end if;
  return null;
end;
$$;

create trigger list_entries_limit after insert or update of list_id on public.list_entries
  for each row execute function public.list_entries_limit();

-- Trigger functions run as their owner and need no caller's EXECUTE.
revoke execute on function public.lists_before_update() from public, anon, authenticated;
revoke execute on function public.list_entries_touch() from public, anon, authenticated;
revoke execute on function public.lists_limit() from public, anon, authenticated;
revoke execute on function public.list_entries_limit() from public, anon, authenticated;

-- Rewrites every position of a list in one statement: p_entries holds
-- each of the list's entry ids exactly once, in the new order.
create function public.reorder_list(p_list uuid, p_entries uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.lists l where l.id = p_list and l.owner_id = auth.uid()
  ) then
    raise exception 'reorder_list: not the owner of the list' using errcode = '42501';
  end if;
  if p_entries is null
     or cardinality(p_entries) <> (select count(distinct x) from unnest(p_entries) as u(x))
     or cardinality(p_entries) <> (
       select count(*) from public.list_entries e where e.list_id = p_list)
     or exists (
       select 1 from unnest(p_entries) as u(x)
       where not exists (
         select 1 from public.list_entries e where e.id = u.x and e.list_id = p_list))
  then
    raise exception 'reorder_list: entries do not match the list' using errcode = '22023';
  end if;
  update public.list_entries e set position = o.ord - 1
    from unnest(p_entries) with ordinality as o(id, ord)
    where e.id = o.id and e.list_id = p_list;
end;
$$;

revoke execute on function public.reorder_list(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_list(uuid, uuid[]) to authenticated;
