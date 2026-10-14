-- Own pictures of homebrew items. A picture is two public files of the bucket
-- homebrew-art under one random name, p/<32 hex>.<ext> (640 px) and
-- t/<32 hex>.<ext> (160 px); homebrew_items.art names the p/ file, or a
-- catalog picture's basename. Storage sets an object's owner_id from the
-- session, so an item names only its owner's uploads. A file lives while an
-- item names it: the database asks the Storage API to delete it through
-- pg_net with a key in Vault, at the row change and in the hourly job.
-- The three read functions answer img beside the item. docs/specs/META.md,
-- section 3;
-- docs/decisions/2026-10-14-own-pictures-are-random-named-files-the-database-deletes.md.

create extension if not exists pg_net with schema extensions;

-- on conflict: the reversal keeps the bucket and its files (Storage refuses a
-- delete of its tables from SQL).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('homebrew-art', 'homebrew-art', true, 204800, array['image/webp', 'image/jpeg'])
  on conflict (id) do nothing;

-- Whether a name is one of an own picture's two files.
create function public.homebrew_art_name_ok(p_name text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(p_name ~ '^[pt]/[0-9a-f]{32}\.(webp|jpg)$', false);
$$;

revoke execute on function public.homebrew_art_name_ok(text) from public, anon;
grant execute on function public.homebrew_art_name_ok(text) to authenticated;

-- Whether the caller may upload one more file: two files per picture, and
-- room for 5 pictures more than the item limit, for the files the hourly job
-- has not deleted yet. No item limit: no file limit.
create function public.homebrew_art_room()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  v_limit := public.effective_limit(auth.uid(), 'homebrew_items_per_owner');
  if v_limit is null then
    return true;
  end if;
  return (select count(*) from storage.objects o
    where o.bucket_id = 'homebrew-art' and o.owner_id = auth.uid()::text) < 2 * (v_limit + 5);
end;
$$;

revoke execute on function public.homebrew_art_room() from public, anon;
grant execute on function public.homebrew_art_room() to authenticated;

-- Readers use the public address, which needs no policy; only the database
-- deletes. No select, update or delete policy.
create policy homebrew_art_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'homebrew-art'
    and public.homebrew_art_name_ok(name)
    and public.homebrew_art_room());

alter table public.homebrew_items add column art text
  constraint homebrew_items_art_shape check (
    art is null
    or art ~ '^p/[0-9a-f]{32}\.(webp|jpg)$'
    or art ~ '^[A-Za-z0-9_-]+\.webp$');

-- "Does an item name this file": one index entry for the release trigger and
-- the job. Each check repeats the predicate art like 'p/%': the planner uses a
-- partial index only for a query that states it (a seq scan at 3x took 7 s for
-- an account deletion of 300 items, measured 2026-10-14 on this host).
create index homebrew_items_art on public.homebrew_items (art) where art like 'p/%';

-- The p/ names queued for deletion, for one day: between the queueing and
-- Storage's answer the object row still exists, and no item may name it.
create table public.homebrew_art_released (
  name text primary key,
  at timestamptz not null default now()
);

alter table public.homebrew_art_released enable row level security;
revoke all on table public.homebrew_art_released from public, anon, authenticated, service_role;

-- Asks the Storage API to delete each own file of p_names (at most 2000) and
-- answers the count, or null when a Vault secret is missing or a call failed.
-- A failure never refuses the row write that called it: the hourly job asks
-- again. The request runs after the commit; a rollback sends nothing.
create function public.art_delete(p_names text[])
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_key text;
  v_name text;
  v_count integer := 0;
begin
  begin
    select s.decrypted_secret into v_url from vault.decrypted_secrets s
      where s.name = 'dhloot_api_url';
    select s.decrypted_secret into v_key from vault.decrypted_secrets s
      where s.name = 'dhloot_storage_key';
    if v_url is null or v_key is null then
      return null;
    end if;
    for v_name in
      select distinct n from unnest(p_names) as n
      where public.homebrew_art_name_ok(n)
      order by n
      limit 2000
    loop
      perform net.http_delete(
        url := rtrim(v_url, '/') || '/storage/v1/object/homebrew-art/' || v_name,
        headers := jsonb_build_object('apikey', v_key));
      v_count := v_count + 1;
    end loop;
    return v_count;
  exception when others then
    raise warning 'art_delete: %', sqlerrm;
    return null;
  end;
end;
$$;

revoke execute on function public.art_delete(text[]) from public, anon, authenticated, service_role;

-- An item names only an upload of its owner that is not queued for deletion.
-- Before triggers fire by name: this one runs before
-- homebrew_items_before_update resets new.owner_id, so an update checks the
-- stored owner. The name locks order this write against a release of the
-- same name; the smaller name first, so two crossed updates cannot deadlock.
create function public.homebrew_items_art_owned()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old text := case when tg_op = 'UPDATE' then old.art end;
  v_owner uuid := case when tg_op = 'UPDATE' then old.owner_id else new.owner_id end;
  v_name text;
begin
  if tg_op = 'UPDATE' and new.art is not distinct from v_old then
    return new;
  end if;
  for v_name in
    select distinct n from unnest(array[v_old, new.art]) as n where n like 'p/%' order by n
  loop
    perform pg_advisory_xact_lock(hashtext('homebrew-art:' || v_name));
  end loop;
  if new.art like 'p/%' and (
    not exists (select 1 from storage.objects o
      where o.bucket_id = 'homebrew-art' and o.name = new.art
        and o.owner_id = v_owner::text)
    or not exists (select 1 from storage.objects o
      where o.bucket_id = 'homebrew-art' and o.name = 't/' || substr(new.art, 3)
        and o.owner_id = v_owner::text)
    or exists (select 1 from public.homebrew_art_released r where r.name = new.art)
  ) then
    raise exception 'homebrew: art missing' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.homebrew_items_art_owned()
  from public, anon, authenticated, service_role;

create trigger homebrew_items_art_owned
  before insert or update of art on public.homebrew_items
  for each row execute function public.homebrew_items_art_owned();

-- A p/ file that no item names any more is queued for deletion with its t/
-- file. An after-row trigger sees the whole statement's result, so a bulk
-- delete of two items that share a picture asks once or twice. An account
-- deletion cascades to the items, so this also deletes the account's files.
create function public.homebrew_items_art_release()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.art like 'p/%' and (tg_op = 'DELETE' or new.art is distinct from old.art) then
    perform pg_advisory_xact_lock(hashtext('homebrew-art:' || old.art));
    if not exists (select 1 from public.homebrew_items i
      where i.art like 'p/%' and i.art = old.art) then
      insert into public.homebrew_art_released (name) values (old.art)
        on conflict (name) do update set at = now();
      perform public.art_delete(array[old.art, 't/' || substr(old.art, 3)]);
    end if;
  end if;
  return null;
end;
$$;

revoke execute on function public.homebrew_items_art_release()
  from public, anon, authenticated, service_role;

create trigger homebrew_items_art_release
  after delete or update of art on public.homebrew_items
  for each row execute function public.homebrew_items_art_release();

-- 20261007130000_homebrew_links.sql's body, plus the files: an own file over
-- an hour old that no item names (an upload whose row never came, or a delete
-- request that failed) is queued, at most 2000 a run; a name another write
-- holds locked waits for the next run. The released names go after a day.
-- Deletes the rows past their retention and answers the counts (pg_cron's
-- run log keeps only the command tag). No API role executes it.
create or replace function public.lifecycle_cleanup()
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_requests integer;
  v_shares integer;
  v_runs integer;
  v_notices integer;
  v_files integer;
  v_name text;
  v_p text;
  v_names text[] := '{}';
begin
  delete from public.purchase_requests r where r.expires_at < now();
  get diagnostics v_requests = row_count;
  -- The owner's panel draws the newest row of each audience; deleting a
  -- stopped newest row would make the panel create a new link.
  delete from public.list_shares s
    where s.revoked_at < now() - interval '30 days'
      and exists (
        select 1 from public.list_shares n
        where n.list_id = s.list_id and n.audience = s.audience
          and n.created_at > s.created_at);
  get diagnostics v_shares = row_count;
  delete from public.list_notices n
    where n.read_at < now() - interval '1 hour'
      or (n.read_at is null and n.created_at < now() - interval '30 days');
  get diagnostics v_notices = row_count;
  delete from cron.job_run_details d where d.end_time < now() - interval '7 days';
  get diagnostics v_runs = row_count;
  for v_name in
    select o.name from storage.objects o
    where o.bucket_id = 'homebrew-art' and public.homebrew_art_name_ok(o.name)
      and o.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from public.homebrew_items i
        where i.art like 'p/%' and i.art = 'p/' || substr(o.name, 3))
    order by o.created_at, o.name
    limit 2000
  loop
    v_p := 'p/' || substr(v_name, 3);
    -- Each check is its own statement: it sees a naming write that committed
    -- while the lock was held.
    if pg_try_advisory_xact_lock(hashtext('homebrew-art:' || v_p))
      and not exists (select 1 from public.homebrew_items i
        where i.art like 'p/%' and i.art = v_p) then
      insert into public.homebrew_art_released (name) values (v_p)
        on conflict (name) do update set at = now();
      v_names := v_names || v_name;
    end if;
  end loop;
  v_files := public.art_delete(v_names);
  delete from public.homebrew_art_released r where r.at < now() - interval '1 day';
  return jsonb_build_object('requests', v_requests, 'shares', v_shares, 'runs', v_runs,
    'notices', v_notices, 'files', v_files);
end;
$$;

-- 20261007130000_homebrew_links.sql's body, with img (the item's art, absent
-- when null) beside the item; the revision hashes it too, and an item without
-- a picture keeps the revision that body gave.
-- One item by its id, for anyone who holds the id (signed out too): ids are
-- random, so items are unlisted, and nobody can list them. related holds the
-- author's items the item names in craft or craft_from, or that name it there,
-- or share its set or its eq.line, without texts or cards, at most 1000.
-- updated_at is the latest edit of the item, its source and its named cards.
-- The answer never holds owner_id, book_id, created_at or another uuid than hid.
create or replace function public.get_homebrew_item(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.homebrew_items;
  v_record jsonb;
  v_related jsonb;
  v_updated timestamptz;
begin
  if p_id is null then
    return null;
  end if;
  select * into v_item from public.homebrew_items i where i.id = p_id;
  if not found then
    return null;
  end if;
  v_record := public.homebrew_item_record(p_id);
  select greatest(v_item.updated_at,
      (select b.updated_at from public.homebrew_books b where b.id = v_item.book_id),
      (select max(c.updated_at) from public.homebrew_cards c
        where c.owner_id = v_item.owner_id
          and ((c.kind = 'set' and c.key = v_item.content ->> 'set')
            or (c.kind = 'ref' and coalesce(v_item.content -> 'refs', '[]'::jsonb) ? c.key))))
    into v_updated;
  select coalesce(jsonb_agg(r.o order by r.name, r.key), '[]'::jsonb) into v_related
    from (
      select jsonb_strip_nulls(jsonb_build_object(
          'hid', i.id,
          'key', i.key,
          'kind', i.content ->> 'kind',
          'en', coalesce(nullif(i.content ->> 'en', ''), i.content ->> 'ru', ''),
          'ru', coalesce(nullif(i.content ->> 'ru', ''), i.content ->> 'en', ''),
          'tier', i.content -> 'tier',
          'eq', case when i.content ? 'eq' then jsonb_strip_nulls(jsonb_build_object(
            't', i.content #> '{eq,t}',
            'tier', i.content #> '{eq,tier}',
            'line', i.content #> '{eq,line}')) end,
          'set', i.content -> 'set',
          'craft', i.content -> 'craft',
          'craft_from', i.content -> 'craft_from')) as o,
        lower(coalesce(nullif(i.content ->> 'en', ''), i.content ->> 'ru', '')) as name,
        i.key
      from public.homebrew_items i
      where i.owner_id = v_item.owner_id and i.id <> v_item.id
        and (coalesce(v_item.content -> 'craft', '[]'::jsonb) ? i.key
          or coalesce(v_item.content -> 'craft_from', '[]'::jsonb) ? i.key
          or coalesce(i.content -> 'craft', '[]'::jsonb) ? v_item.key
          or coalesce(i.content -> 'craft_from', '[]'::jsonb) ? v_item.key
          or i.content ->> 'set' = v_item.content ->> 'set'
          or i.content #>> '{eq,line}' = v_item.content #>> '{eq,line}')
      order by name, i.key
      limit 1000
    ) r;
  return jsonb_build_object(
    'hid', v_item.id,
    'mine', coalesce(v_item.owner_id = auth.uid(), false),
    -- Compared for equality by a re-read: it moves with any change of the
    -- item, its picture, its source, its cards or a related item. The related
    -- rows hold no null, so the strip only drops a null img.
    'revision', md5((v_record || jsonb_strip_nulls(
      jsonb_build_object('related', v_related, 'img', v_item.art)))::text),
    'item', v_record,
    'related', v_related,
    'updated_at', v_updated)
    || case when v_item.art is null then '{}'::jsonb
       else jsonb_build_object('img', v_item.art) end;
end;
$$;

-- 20261007130000_homebrew_links.sql's body, with img beside each item (absent
-- when null; jsonb_strip_nulls would also strip the null fields of the item).
-- The linked items of the account's lists in one read: [{ hid, item, img }] for
-- each id that exists, in the given order. Signed in only: a shared page reads
-- through get_shared_list(), an item page through get_homebrew_item().
create or replace function public.get_homebrew_items(p_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if p_ids is null or cardinality(p_ids) > 1000 then
    raise exception 'get_homebrew_items: not a list of at most 1000 ids' using errcode = '22023';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('hid', i.id, 'item', public.homebrew_item_record(i.id))
        || case when i.art is null then '{}'::jsonb else jsonb_build_object('img', i.art) end
        order by u.n)
    from (select x.id, min(x.n) as n from unnest(p_ids) with ordinality as x(id, n)
          group by x.id) u
    join public.homebrew_items i on i.id = u.id), '[]'::jsonb);
end;
$$;

-- 20261007130100_list_entry_gm_only.sql's projection, with img (the linked
-- item's art, absent when null) beside hid: a players' share leaves out the
-- GM-only entries, with their hid, record and img, and numbers the rest from
-- 0; a GM's share writes gm_only on each entry. Every later redefinition keeps
-- both rules
-- (docs/decisions/2026-10-08-a-gm-only-entry-is-dropped-by-the-share-projection.md).
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
            'snapshot', case when e.hb_item is null then null
              else public.homebrew_item_record(e.hb_item) end,
            'position', e.ord,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when e.hb_item is null then '{}'::jsonb
             else jsonb_strip_nulls(jsonb_build_object('hid', e.hb_item,
               'img', (select i.art from public.homebrew_items i where i.id = e.hb_item))) end
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note, 'gm_only', e.gm_only)
             else '{}'::jsonb end
          order by e.ord)
      from (select e.*, row_number() over (order by e.position, e.id) - 1 as ord
          from public.list_entries e
          where e.list_id = v_list.id and (v_gm or not e.gm_only)) e), '[]'::jsonb));
end;
$$;
