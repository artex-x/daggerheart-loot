-- Print sets: the ordered entries of one print sheet and their counts, owned
-- by the account that made them and read by a short id by any signed-in
-- reader. A set holds references (a catalog id or a homebrew item's id), never
-- a record or a picture name, so a reader sees the cards as they are now. It
-- lives 90 days after its last open; the hourly job deletes it.
-- docs/specs/META.md, section 3;
-- docs/decisions/2026-10-08-a-print-set-holds-references-and-lives-90.md.

create table public.print_sets (
  -- 9 random bytes from two v4 uuids (bytes 1-6 of each are random), base64url:
  -- 12 characters, 72 bits. An id is unlisted, not secret.
  id text primary key
    default translate(encode(
      substring(decode(replace(gen_random_uuid()::text, '-', ''), 'hex') from 1 for 6)
      || substring(decode(replace(gen_random_uuid()::text, '-', ''), 'hex') from 1 for 3),
      'base64'), '+/', '-_')
    check (id ~ '^[A-Za-z0-9_-]{12}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  -- 180 is the app's PRINT_MAX (app/src/lib/hash.ts), a render bound: no
  -- limit override lifts it.
  entries jsonb not null
    check (jsonb_typeof(entries) = 'array' and jsonb_array_length(entries) between 1 and 180),
  -- md5 of entries::text: one row for the same sheet of one account.
  digest text not null,
  created_at timestamptz not null default now(),
  opened_at timestamptz not null default now()
);

create unique index print_sets_owner_digest on public.print_sets (owner_id, digest);
create index print_sets_opened on public.print_sets (opened_at);

-- No grant and no policy: only the two functions below read or write it.
alter table public.print_sets enable row level security;
revoke all on table public.print_sets from public, anon, authenticated;

insert into public.limit_defaults (key, value) values ('print_sets_per_owner', 1000);

-- Stores the sheet p_entries ([{ k | h, q? }]) for the caller and answers its
-- id. The same sheet again answers the same id and moves its opened_at, an
-- expired row the job has not deleted yet included; the per-account lock
-- orders the count and the insert of two calls.
create function public.create_print_set(p_entries jsonb)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_digest text;
  v_id text;
  v_max integer;
  v_try integer := 0;
  v_constraint text;
begin
  if auth.uid() is null then
    raise exception 'create_print_set: not signed in' using errcode = '28000';
  end if;
  -- Separate statements: SQL does not promise the order of an OR, and
  -- jsonb_array_length raises on a non-array.
  if p_entries is null or jsonb_typeof(p_entries) <> 'array' then
    raise exception 'print set: bad entries' using errcode = '22023';
  end if;
  if octet_length(p_entries::text) > 16384
    or jsonb_array_length(p_entries) not between 1 and 180 then
    raise exception 'print set: bad entries' using errcode = '22023';
  end if;
  -- An h that names no item is stored as given: the read drops it, and the
  -- item may go between the draw and the press.
  if exists (
    select 1 from jsonb_array_elements(p_entries) e
    where case when jsonb_typeof(e) <> 'object' then true else
      exists (select 1 from jsonb_object_keys(e) k where k not in ('k', 'h', 'q'))
      or (e ? 'k') = (e ? 'h')
      or (e ? 'k' and (jsonb_typeof(e -> 'k') <> 'string'
        or e ->> 'k' !~ '^[a-z0-9_]{1,32}$' or starts_with(e ->> 'k', 'hb_')))
      or (e ? 'h' and (jsonb_typeof(e -> 'h') <> 'string'
        or e ->> 'h' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'))
      or (e ? 'q' and case
        when jsonb_typeof(e -> 'q') <> 'number' or e ->> 'q' !~ '^[0-9]{1,2}$' then true
        else (e ->> 'q')::integer < 2 end)
    end)
    or exists (
      select 1 from jsonb_array_elements(p_entries) e
      where e ? 'k' group by e ->> 'k' having count(*) > 1)
    or exists (
      select 1 from jsonb_array_elements(p_entries) e
      where e ? 'h' group by e ->> 'h' having count(*) > 1)
  then
    raise exception 'print set: bad entries' using errcode = '22023';
  end if;
  -- jsonb sorts the keys of each entry; the array order is the sheet's.
  v_digest := md5(p_entries::text);
  perform pg_advisory_xact_lock(hashtext('print_sets:' || auth.uid()::text));
  update public.print_sets s set opened_at = now()
    where s.owner_id = auth.uid() and s.digest = v_digest
    returning s.id into v_id;
  if found then
    return v_id;
  end if;
  v_max := public.effective_limit(auth.uid(), 'print_sets_per_owner');
  -- An expired row the job has not deleted yet does not count.
  if v_max is not null and (select count(*) from public.print_sets s
      where s.owner_id = auth.uid() and s.opened_at >= now() - interval '90 days') >= v_max then
    raise exception 'limit: print_sets_per_owner' using errcode = 'P0001', detail = v_max::text;
  end if;
  loop
    begin
      insert into public.print_sets (owner_id, entries, digest)
        values (auth.uid(), p_entries, v_digest)
        returning id into v_id;
      return v_id;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      v_try := v_try + 1;
      if v_constraint <> 'print_sets_pkey' or v_try > 3 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

-- The set p_id as { entries, missing } for a signed-in reader, or null for a
-- null, malformed, unknown or expired id - one answer for all four. A k entry
-- comes as stored; an h entry as { hid, item, img?, q? } with the item as its
-- author last saved it; an h whose item is gone is left out and counted in
-- missing. An open moves opened_at at most once a day: the first read function
-- that writes, for the 90-day lifetime after the last open. The answer never
-- holds the owner, the digest, a time or another uuid than an entry's hid.
create function public.get_print_set(p_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_set public.print_sets;
  v_entries jsonb;
begin
  if auth.uid() is null or p_id is null or p_id !~ '^[A-Za-z0-9_-]{12}$' then
    return null;
  end if;
  select * into v_set from public.print_sets s
    where s.id = p_id and s.opened_at >= now() - interval '90 days';
  if not found then
    return null;
  end if;
  if v_set.opened_at < now() - interval '1 day' then
    update public.print_sets s set opened_at = now() where s.id = p_id;
  end if;
  -- Not jsonb_strip_nulls: it is recursive and would drop the null fields of
  -- the item too.
  select coalesce(jsonb_agg(x.o order by x.n), '[]'::jsonb) into v_entries
    from (
      select e.n,
        case when e.v ? 'k' then e.v
        else jsonb_build_object('hid', i.id, 'item', public.homebrew_item_record(i.id))
          || case when i.art is null then '{}'::jsonb else jsonb_build_object('img', i.art) end
          || case when e.v ? 'q' then jsonb_build_object('q', e.v -> 'q') else '{}'::jsonb end
        end as o
      from jsonb_array_elements(v_set.entries) with ordinality as e(v, n)
      left join public.homebrew_items i on i.id = (e.v ->> 'h')::uuid
      where e.v ? 'k' or i.id is not null
    ) x;
  return jsonb_build_object('entries', v_entries,
    'missing', jsonb_array_length(v_set.entries) - jsonb_array_length(v_entries));
end;
$$;

revoke execute on function public.create_print_set(jsonb) from public, anon;
revoke execute on function public.get_print_set(text) from public, anon;
grant execute on function public.create_print_set(jsonb) to authenticated;
grant execute on function public.get_print_set(text) to authenticated;

-- 20261014120000_homebrew_art.sql's body, plus print sets 90 days after their
-- last open. A set names no file, so the files block is unchanged.
-- An own file over an hour old that no item names (an upload whose row never
-- came, or a delete request that failed) is queued, at most 2000 a run; a name
-- another write holds locked waits for the next run. The released names go
-- after a day. Deletes the rows past their retention and answers the counts
-- (pg_cron's run log keeps only the command tag). No API role executes it.
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
  v_print_sets integer;
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
  delete from public.print_sets p where p.opened_at < now() - interval '90 days';
  get diagnostics v_print_sets = row_count;
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
    'notices', v_notices, 'files', v_files, 'print_sets', v_print_sets);
end;
$$;
