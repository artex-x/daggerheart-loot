-- A list entry of a homebrew item is a live link by the item's id
-- (list_entries.hb_item), for an own item and another account's alike; the
-- stored frozen copies become links, and the one copy with no own holder is
-- deleted. Anyone with an item's id reads it through get_homebrew_item(); a
-- linked item's edit or delete leaves a notice on each list of another owner
-- (list_notices). A purchase request expires 1 hour after it is read, or 30
-- days after it is created. docs/specs/META.md, section 3;
-- docs/decisions/2026-10-07-an-item-is-read-by-its-id-by-anyone-a-list-holds-a-live-link.md;
-- docs/decisions/2026-10-07-a-lists-change-log-shares-the-requests-view-and-clean-up.md.

alter table public.list_entries
  add column hb_item uuid references public.homebrew_items (id) on delete cascade;

create index list_entries_hb_item on public.list_entries (hb_item);

-- The conversion: a reference and a frozen copy whose key the list's owner
-- holds link that own item. Production held one frozen copy with no own
-- holder, released for deletion by its owner; more than one stops the
-- migration, which then changes nothing.
update public.list_entries e set hb_item = i.id
  from public.lists l, public.homebrew_items i
  where e.source = 'homebrew' and l.id = e.list_id
    and i.owner_id = l.owner_id and i.key = e.item_key;

do $$
declare
  v_orphans integer;
begin
  select count(*) into v_orphans from public.list_entries e
    where e.source = 'homebrew' and e.hb_item is null;
  if v_orphans > 1 then
    raise exception 'homebrew_links: % frozen copies have no own holder; at most 1 may be deleted',
      v_orphans using errcode = 'P0001';
  end if;
  delete from public.list_entries e where e.source = 'homebrew' and e.hb_item is null;
  if exists (select 1 from public.list_entries e
      where e.source = 'homebrew' and e.hb_item is null) then
    raise exception 'homebrew_links: a homebrew entry has no link after the conversion'
      using errcode = 'P0001';
  end if;
end;
$$;

alter table public.list_entries
  add constraint list_entries_hb_item_source check ((source = 'homebrew') = (hb_item is not null));

-- The foreign key checks that the item exists and holds its key share lock.
drop trigger list_entries_reference_exists on public.list_entries;
drop function public.list_entries_reference_exists();

-- Definer: it reads another owner's item. An entry sent by key (a stale tab, an
-- older import) links the list owner's item of that key; a linked entry takes
-- its key and source from the item, so unique (list_id, item_key) and the
-- request lines keep naming it.
create function public.list_entries_hb_key()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_key text;
begin
  if new.hb_item is null and new.source = 'homebrew' then
    select i.id into v_id from public.homebrew_items i
      join public.lists l on l.owner_id = i.owner_id
      where l.id = new.list_id and i.key = new.item_key;
    if not found then
      raise exception 'list_entries: no homebrew item %', new.item_key using errcode = '23503';
    end if;
    new.hb_item := v_id;
  end if;
  if new.hb_item is not null then
    select i.key into v_key from public.homebrew_items i where i.id = new.hb_item;
    if not found then
      raise exception 'list_entries: no homebrew item %', new.hb_item using errcode = '23503';
    end if;
    new.item_key := v_key;
    new.source := 'homebrew';
  end if;
  return new;
end;
$$;

create trigger list_entries_hb_key
  before insert or update of hb_item, item_key, source on public.list_entries
  for each row execute function public.list_entries_hb_key();

revoke execute on function public.list_entries_hb_key() from public, anon, authenticated;

drop trigger list_entries_snapshot_limit_insert on public.list_entries;
drop trigger list_entries_snapshot_limit_update on public.list_entries;
drop function public.list_entries_snapshot_limit();

-- The column stays, always null, for one release: the previous frontend
-- selects it, so a frontend-only revert keeps reading the lists. The next
-- release's first migration drops it (docs/specs/DEBT.md).
update public.list_entries set snapshot = null where snapshot is not null;

alter table public.list_entries
  drop constraint list_entries_snapshot_source,
  drop constraint list_entries_snapshot_valid,
  drop constraint list_entries_snapshot_size,
  add constraint list_entries_snapshot_null check (snapshot is null);

-- Overrides of the key go with it (on delete cascade).
delete from public.limit_defaults where key = 'snapshot_bytes_per_list';

-- The change log: one row per list and item, written only by the homebrew
-- triggers; the list's owner reads and hides (deletes) its rows, and only
-- mark_list_read() sets read_at, to the database's now(). The hourly
-- lifecycle_cleanup() deletes a row 1 hour after its read, or 30 days after
-- its creation while unread.
create table public.list_notices (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  item_key text not null check (item_key ~ '^[A-Za-z0-9_-]{1,64}$'),
  -- Null once the item is deleted.
  hid uuid,
  kind text not null check (kind in ('changed', 'deleted')),
  -- The item's names at the time: { en, ru }.
  name jsonb not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (list_id, item_key)
);

alter table public.list_notices enable row level security;

revoke all on table public.list_notices from public, anon, authenticated;
grant select, delete on table public.list_notices to authenticated;

create policy list_notices_owner_select on public.list_notices
  for select to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));
create policy list_notices_owner_delete on public.list_notices
  for delete to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));

-- One notice message per list owner per transaction, at commit, as
-- homebrew_broadcast sends; a read changes only read_at and sends nothing, so
-- the owner's devices do not wake each other.
create function public.list_notices_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_done text := coalesce(current_setting('dhloot.notice_broadcast', true), '');
begin
  if tg_op = 'UPDATE' and new.kind is not distinct from old.kind
     and new.created_at is not distinct from old.created_at then
    return null;
  end if;
  begin
    select l.owner_id into v_owner from public.lists l where l.id = new.list_id;
    if v_owner is null or strpos(v_done, v_owner::text) > 0 then
      return null;
    end if;
    perform set_config('dhloot.notice_broadcast', v_done || v_owner::text || ',', true);
    perform realtime.send(
      jsonb_build_object('list', new.list_id), 'notice', 'owner:' || v_owner::text, true);
  exception when others then
    -- A broadcast never fails the author's write.
    raise warning 'list_notices_broadcast: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

create constraint trigger list_notices_broadcast
  after insert or update on public.list_notices
  deferrable initially deferred
  for each row execute function public.list_notices_broadcast();

revoke execute on function public.list_notices_broadcast() from public, anon, authenticated;

-- A purchase request can be decided until expires_at: 30 days after it is
-- created, capped at 1 hour after its first read (mark_list_read(), an apply
-- or a decline). purchase_requests_broadcast fires on a status change only,
-- so a read sends no message.
alter table public.purchase_requests add column read_at timestamptz;

update public.purchase_requests r set expires_at = r.created_at + interval '30 days'
  where r.status = 'pending' and r.expires_at > now();

-- The body of 20261007120000_lifecycle_cleanup.sql with 30 days for 1 hour;
-- create or replace keeps the grants.
-- Sends a request for p_lines ([{ item, qty }]) through an active share
-- token. Answers nothing; every refusal is an exception the client maps.
create or replace function public.create_purchase_request(p_id uuid, p_token text, p_lines jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_share public.list_shares;
  v_owner uuid;
  v_other uuid;
  v_max integer;
begin
  -- The token before the id: a bad token always gets the one answer, as
  -- get_shared_list() gives for a null, malformed, unknown or stopped one.
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  select * into v_share from public.list_shares s
    where s.token = p_token and s.revoked_at is null;
  if not found then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  if p_id is null then
    raise exception 'request: bad id' using errcode = '22023';
  end if;
  select l.owner_id into v_owner from public.lists l where l.id = v_share.list_id;

  -- Two sends to one list count the rate and the cap in order, as the
  -- limit triggers do.
  perform pg_advisory_xact_lock(hashtext('requests:' || v_share.list_id::text));

  select r.share_id into v_other from public.purchase_requests r where r.id = p_id;
  if found then
    if v_other = v_share.id then
      return;
    end if;
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;

  if jsonb_typeof(p_lines) is distinct from 'array' then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if octet_length(p_lines::text) > 32768 or jsonb_array_length(p_lines) < 1 then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) as e
    where jsonb_typeof(e) <> 'object'
      or jsonb_typeof(e -> 'item') is distinct from 'string'
      or jsonb_typeof(e -> 'qty') is distinct from 'number'
      or not coalesce((e ->> 'item') ~ '^[A-Za-z0-9_-]{1,64}$', false)
      or not coalesce((e ->> 'qty') ~ '^[0-9]{1,2}$', false)
  ) then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lines) as e where (e ->> 'qty')::integer < 1
  ) or (
    select count(distinct e ->> 'item') from jsonb_array_elements(p_lines) as e
  ) <> jsonb_array_length(p_lines) then
    raise exception 'request: bad lines' using errcode = '22023';
  end if;

  v_max := public.effective_limit(v_owner, 'request_lines');
  if v_max is not null and jsonb_array_length(p_lines) > v_max then
    raise exception 'limit: request_lines' using errcode = 'P0001', detail = v_max::text;
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_lines) as e
    where not exists (
      select 1 from public.list_entries le
      where le.list_id = v_share.list_id and le.item_key = e ->> 'item')
  ) then
    raise exception 'request: stale' using errcode = '22023';
  end if;

  if (
    select count(*) from public.purchase_requests r
    where r.share_id = v_share.id and r.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'limit: request_rate' using errcode = 'P0001', detail = '5';
  end if;

  v_max := public.effective_limit(v_owner, 'pending_requests_per_list');
  if v_max is not null and (
    select count(*) from public.purchase_requests r
    where r.list_id = v_share.list_id and r.status = 'pending' and r.expires_at > now()
  ) >= v_max then
    raise exception 'limit: pending_requests_per_list' using errcode = 'P0001',
      detail = v_max::text;
  end if;

  insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
    values (p_id, v_share.list_id, v_share.id, v_share.audience, now() + interval '30 days')
    on conflict (id) do nothing
    returning id into v_other;
  -- The id was taken on another list after the replay read: the list lock
  -- does not cover it.
  if not found then
    raise exception 'request: unknown link' using errcode = 'P0002';
  end if;
  -- A scalar read, not a join: an entry deleted since the stale check
  -- leaves its line with a null price instead of dropping it.
  insert into public.purchase_request_lines (request_id, item_key, quantity, price_coins)
    select p_id, e ->> 'item', (e ->> 'qty')::integer,
      (select le.price_coins from public.list_entries le
        where le.list_id = v_share.list_id and le.item_key = e ->> 'item')
    from jsonb_array_elements(p_lines) as e;
end;
$$;

-- The bodies of 20260928120000_purchase_requests.sql with the first read
-- before the expiry check: a request decided at its first sight is the read.
-- Takes each line's count from the list's entry of the same item, or
-- answers { short } and changes nothing when the stock is too low (with
-- p_clamp, only when nothing is there). An entry taken whole is deleted.
create or replace function public.apply_purchase_request(p_id uuid, p_clamp boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.purchase_requests;
  v_short jsonb;
  v_none boolean;
  v_deleted integer;
  v_taken integer;
begin
  select r.* into v_req from public.purchase_requests r
    join public.lists l on l.id = r.list_id
    where r.id = p_id and l.owner_id = auth.uid()
    for update of r;
  if not found then
    raise exception 'request: not the owner of the request' using errcode = '42501';
  end if;
  -- The list row before the entries: two decisions on one list run in
  -- order, so the renumber below never waits on an entry another apply holds.
  perform 1 from public.lists l where l.id = v_req.list_id for no key update;
  if v_req.status <> 'pending' then
    raise exception 'request: decided' using errcode = '22023';
  end if;
  if v_req.read_at is null then
    update public.purchase_requests r
      set read_at = now(), expires_at = least(r.expires_at, now() + interval '1 hour')
      where r.id = p_id
      returning r.* into v_req;
  end if;
  if v_req.expires_at <= now() then
    raise exception 'request: expired' using errcode = '22023';
  end if;

  perform 1 from public.list_entries e
    where e.list_id = v_req.list_id
      and e.item_key in (
        select pl.item_key from public.purchase_request_lines pl where pl.request_id = p_id)
    order by e.id
    for update;

  select
      jsonb_agg(jsonb_build_object('item', x.item_key, 'want', x.want, 'have', x.have)
        order by x.item_key) filter (where x.want > x.have),
      bool_and(x.have = 0)
    into v_short, v_none
    from (
      select pl.item_key, pl.quantity as want, coalesce(e.quantity, 0) as have
      from public.purchase_request_lines pl
      left join public.list_entries e
        on e.list_id = v_req.list_id and e.item_key = pl.item_key
      where pl.request_id = p_id
    ) x;
  if v_short is not null and (not coalesce(p_clamp, false) or v_none) then
    return jsonb_build_object('short', v_short);
  end if;

  update public.purchase_request_lines pl
    set applied_quantity = least(pl.quantity, coalesce((
      select e.quantity from public.list_entries e
      where e.list_id = v_req.list_id and e.item_key = pl.item_key), 0))
    where pl.request_id = p_id;
  delete from public.list_entries e
    using public.purchase_request_lines pl
    where pl.request_id = p_id and e.list_id = v_req.list_id and e.item_key = pl.item_key
      and e.quantity = pl.applied_quantity;
  get diagnostics v_deleted = row_count;
  update public.list_entries e
    set quantity = e.quantity - pl.applied_quantity
    from public.purchase_request_lines pl
    where pl.request_id = p_id and e.list_id = v_req.list_id and e.item_key = pl.item_key
      and pl.applied_quantity > 0;
  -- A delete leaves a gap; the renumber to 0..n-1 keeps the owner's next
  -- add at the end from sharing a position.
  if v_deleted > 0 then
    perform public.reorder_list(v_req.list_id, '{}');
  end if;

  update public.purchase_requests r set status = 'applied', decided_at = now()
    where r.id = p_id;
  select coalesce(sum(pl.applied_quantity), 0)::integer into v_taken
    from public.purchase_request_lines pl where pl.request_id = p_id;
  return jsonb_build_object('applied', true, 'taken', v_taken);
end;
$$;

create or replace function public.decline_purchase_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_req public.purchase_requests;
begin
  select r.* into v_req from public.purchase_requests r
    join public.lists l on l.id = r.list_id
    where r.id = p_id and l.owner_id = auth.uid()
    for update of r;
  if not found then
    raise exception 'request: not the owner of the request' using errcode = '42501';
  end if;
  perform 1 from public.lists l where l.id = v_req.list_id for no key update;
  if v_req.status <> 'pending' then
    raise exception 'request: decided' using errcode = '22023';
  end if;
  if v_req.read_at is null then
    update public.purchase_requests r
      set read_at = now(), expires_at = least(r.expires_at, now() + interval '1 hour')
      where r.id = p_id
      returning r.* into v_req;
  end if;
  if v_req.expires_at <= now() then
    raise exception 'request: expired' using errcode = '22023';
  end if;
  update public.purchase_requests r set status = 'declined', decided_at = now()
    where r.id = p_id;
end;
$$;

-- The owner's page has drawn the list's unread notices and requests: each
-- unread row is read now, and a request's expiry is capped at 1 hour from
-- now. The value is always the database's clock.
create function public.mark_list_read(p_list uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.lists l where l.id = p_list and l.owner_id = auth.uid()
  ) then
    raise exception 'mark_list_read: not the owner of the list' using errcode = '42501';
  end if;
  update public.list_notices n set read_at = now()
    where n.list_id = p_list and n.read_at is null;
  update public.purchase_requests r
    set read_at = now(), expires_at = least(r.expires_at, now() + interval '1 hour')
    where r.list_id = p_list and r.read_at is null;
end;
$$;

revoke execute on function public.mark_list_read(uuid) from public, anon;
grant execute on function public.mark_list_read(uuid) to authenticated;

-- Bumps every list that links one of p_items, of any owner, and upserts a
-- notice of p_kind for each such list whose owner is not the item's. One row
-- per list and item: a later change refreshes it and makes it unread again.
create function public.homebrew_links_touch(p_items uuid[], p_kind text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if cardinality(p_items) = 0 then
    return;
  end if;
  -- A delete's cascade bumps the lists itself.
  if p_kind = 'changed' then
    update public.lists l set revision = revision + 1, updated_at = now()
      where l.id in (select e.list_id from public.list_entries e where e.hb_item = any (p_items));
  end if;
  insert into public.list_notices (list_id, item_key, hid, kind, name)
    select e.list_id, i.key, case when p_kind = 'deleted' then null else i.id end, p_kind,
      jsonb_build_object(
        'en', coalesce(nullif(i.content ->> 'en', ''), i.content ->> 'ru', ''),
        'ru', coalesce(nullif(i.content ->> 'ru', ''), i.content ->> 'en', ''))
    from public.list_entries e
    join public.homebrew_items i on i.id = e.hb_item
    join public.lists l on l.id = e.list_id
    where e.hb_item = any (p_items) and l.owner_id <> i.owner_id
    on conflict (list_id, item_key) do update
      set kind = excluded.kind, name = excluded.name, hid = excluded.hid,
        created_at = now(), read_at = null;
end;
$$;

create or replace function public.homebrew_items_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.homebrew_links_touch(array[new.id], 'changed');
  return null;
end;
$$;

-- A source's delete needs no trigger: on delete set null updates its items,
-- whose own touch bumps the lists.
create or replace function public.homebrew_books_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.homebrew_links_touch(
    array(select i.id from public.homebrew_items i where i.book_id = new.id), 'changed');
  return null;
end;
$$;

-- A card's write is an edit of every item of the owner that names it: a
-- linked item's record embeds the card.
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

-- Each list of another owner that links the item gets a deleted notice with
-- the item's names; the foreign key's cascade then removes every linked entry.
create or replace function public.homebrew_items_before_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.homebrew_links_touch(array[old.id], 'deleted');
  return old;
end;
$$;

revoke execute on function public.homebrew_links_touch(uuid[], text)
  from public, anon, authenticated;

-- The record a reader receives for one item: homebrew_snapshot_of() with the
-- item owner's source and the owner's cards the item names, as a share's
-- projection carries it. Null for an unknown id.
create function public.homebrew_item_record(p_id uuid)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select public.homebrew_snapshot_of(i.key, i.content, case when b.id is null
      then null else b.content || jsonb_build_object('key', b.key) end,
    (select jsonb_agg(c.content || jsonb_build_object('key', c.key, 'kind', c.kind))
      from public.homebrew_cards c
      where c.owner_id = i.owner_id
        and ((c.kind = 'set' and c.key = i.content ->> 'set')
          or (c.kind = 'ref' and coalesce(i.content -> 'refs', '[]'::jsonb) ? c.key))))
  from public.homebrew_items i
  left join public.homebrew_books b on b.id = i.book_id
  where i.id = p_id;
$$;

revoke execute on function public.homebrew_item_record(uuid) from public, anon, authenticated;

-- One item by its id, for anyone who holds the id (signed out too): ids are
-- random, so items are unlisted, and nobody can list them. related holds the
-- author's items the item names in craft or craft_from, or that name it there,
-- or share its set or its eq.line, without texts or cards, at most 1000.
-- updated_at is the latest edit of the item, its source and its named cards.
-- The answer never holds owner_id, book_id, created_at or another uuid than hid.
create function public.get_homebrew_item(p_id uuid)
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
    -- item, its source, its cards or a related item.
    'revision', md5((v_record || jsonb_build_object('related', v_related))::text),
    'item', v_record,
    'related', v_related,
    'updated_at', v_updated);
end;
$$;

revoke execute on function public.get_homebrew_item(uuid) from public;
grant execute on function public.get_homebrew_item(uuid) to anon, authenticated;

-- The linked items of the account's lists in one read: [{ hid, item }] for each
-- id that exists, in the given order. Signed in only: a shared page reads
-- through get_shared_list(), an item page through get_homebrew_item().
create function public.get_homebrew_items(p_ids uuid[])
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
        order by u.n)
    from (select x.id, min(x.n) as n from unnest(p_ids) with ordinality as x(id, n)
          group by x.id) u
    join public.homebrew_items i on i.id = u.id), '[]'::jsonb);
end;
$$;

revoke execute on function public.get_homebrew_items(uuid[]) from public, anon;
grant execute on function public.get_homebrew_items(uuid[]) to authenticated;

-- 20261001130000_homebrew_relations.sql's projection: a homebrew entry's
-- snapshot is filled from its linked item, of any owner, with that owner's
-- source and cards, and the entry carries the item's hid beside it.
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
            'position', e.position,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when e.hb_item is null then '{}'::jsonb
             else jsonb_build_object('hid', e.hb_item) end
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note)
             else '{}'::jsonb end
          order by e.position, e.id)
      from public.list_entries e where e.list_id = v_list.id), '[]'::jsonb));
end;
$$;

-- R2's copy: every homebrew entry links the item its source entry links, for
-- the list's owner and anyone else alike.
create or replace function public.clone_shared_list(p_token text, p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_shared jsonb;
  v_inserted uuid;
begin
  if auth.uid() is null then
    raise exception 'clone_shared_list: not signed in' using errcode = '28000';
  end if;
  v_shared := public.get_shared_list(p_token);
  if v_shared is null then
    raise exception 'clone_shared_list: unknown link' using errcode = '22023';
  end if;
  insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
    values (
      p_id,
      auth.uid(),
      v_shared -> 'list' ->> 'name',
      v_shared -> 'list' ->> 'money_mode',
      v_shared -> 'list' ->> 'player_note',
      coalesce(v_shared -> 'list' ->> 'gm_note', ''))
    on conflict (id) do nothing
    returning id into v_inserted;
  if v_inserted is null then
    if not exists (
      select 1 from public.lists l where l.id = p_id and l.owner_id = auth.uid()
    ) then
      raise exception 'clone_shared_list: the id belongs to another list' using errcode = '42501';
    end if;
    return p_id;
  end if;
  insert into public.list_entries (
      id, list_id, item_key, source, hb_item, position, quantity, price_coins,
      player_note, gm_note)
    select
      gen_random_uuid(),
      p_id,
      e ->> 'item_key',
      e ->> 'source',
      (e ->> 'hid')::uuid,
      (e ->> 'position')::integer,
      (e ->> 'quantity')::integer,
      (e ->> 'price_coins')::integer,
      e ->> 'player_note',
      coalesce(e ->> 'gm_note', '')
    from jsonb_array_elements(v_shared -> 'entries') as e;
  return p_id;
end;
$$;

-- 20260925130600_list_writes.sql's body: an entry carries hb_item in place of a
-- snapshot, a snapshot is refused, and relink points an entry at another item
-- in place, so its position, quantity, price and notes stay.
-- Applies the account write buffer in one call: each write in order, in
-- its own subtransaction, as the caller, so row level security and the
-- count limits apply as to a plain write. Answers one result per write.
-- docs/specs/FEATURES.md, "Lists".
create or replace function public.apply_list_writes(p_ops jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_op jsonb;
  v_kind text;
  v_id uuid;
  v_patch jsonb;
  v_field text;
  v_out jsonb := '[]'::jsonb;
  v_state text;
  v_msg text;
  v_detail text;
begin
  if auth.uid() is null then
    raise exception 'apply_list_writes: not signed in' using errcode = '28000';
  end if;
  if p_ops is null or jsonb_typeof(p_ops) <> 'array' then
    raise exception 'apply_list_writes: not a list of writes' using errcode = '22023';
  end if;
  if jsonb_array_length(p_ops) > 200 then
    raise exception 'apply_list_writes: more than 200 writes' using errcode = '22023';
  end if;
  for v_op in
    select t.e from jsonb_array_elements(p_ops) with ordinality as t(e, n) order by t.n
  loop
    begin
      v_kind := case when jsonb_typeof(v_op) = 'object' then v_op ->> 'op' end;
      case v_kind
        when 'create', 'add' then
          if v_kind = 'create' then
            if jsonb_typeof(v_op -> 'list') is distinct from 'object' then
              raise exception 'apply_list_writes: invalid list' using errcode = '22023';
            end if;
            v_id := (v_op #>> '{list,id}')::uuid;
            insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
              select v_id, auth.uid(), x.name, x.money_mode, x.player_note, x.gm_note
              from jsonb_to_record(v_op -> 'list')
                as x(name text, money_mode text, player_note text, gm_note text)
              on conflict (id) do nothing;
            -- Row level security hides another owner's row: a conflict with
            -- it inserts nothing, and this read finds nothing.
            if not exists (select 1 from public.lists l where l.id = v_id) then
              raise exception 'apply_list_writes: the id belongs to another list'
                using errcode = '42501';
            end if;
          else
            v_id := (v_op ->> 'list_id')::uuid;
            if v_id is null then
              raise exception 'apply_list_writes: invalid id' using errcode = '22023';
            end if;
            -- A list deleted meanwhile, or hidden by row level security, is
            -- gone, as for an update: the insert policy would answer 42501.
            if not exists (select 1 from public.lists l where l.id = v_id) then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
          if jsonb_typeof(v_op -> 'entries') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid entries' using errcode = '22023';
          end if;
          if jsonb_array_length(v_op -> 'entries') > 5000 then
            raise exception 'apply_list_writes: more than 5000 entries' using errcode = '22023';
          end if;
          -- A previous bundle's frozen copy: the list now links the item instead.
          if exists (
            select 1 from jsonb_array_elements(v_op -> 'entries') as t(e)
            where jsonb_typeof(t.e) = 'object'
              and coalesce(t.e -> 'snapshot', 'null'::jsonb) <> 'null'::jsonb
          ) then
            raise exception 'apply_list_writes: an entry holds a snapshot; send hb_item instead'
              using errcode = '22023';
          end if;
          insert into public.list_entries (id, list_id, item_key, source, hb_item, position,
              quantity, price_coins, player_note, gm_note)
            select x.id, v_id, x.item_key, x.source, x.hb_item, x.position, x.quantity,
              x.price_coins, x.player_note, x.gm_note
            from jsonb_to_recordset(v_op -> 'entries') as x(id uuid, item_key text,
              source text, hb_item uuid, position integer, quantity integer,
              price_coins integer, player_note text, gm_note text)
            on conflict (id) do nothing;
        when 'update' then
          if v_op ->> 'id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          v_patch := v_op -> 'patch';
          if jsonb_typeof(v_patch) is distinct from 'object' then
            raise exception 'apply_list_writes: invalid patch' using errcode = '22023';
          end if;
          select k into v_field from jsonb_object_keys(v_patch) as k
            where k not in ('name', 'money_mode', 'player_note', 'gm_note') limit 1;
          if found then
            raise exception 'apply_list_writes: unknown field %', v_field using errcode = '22023';
          end if;
          if v_patch <> '{}'::jsonb then
            update public.lists l set
                name = case when v_patch ? 'name' then v_patch ->> 'name' else l.name end,
                money_mode = case when v_patch ? 'money_mode'
                  then v_patch ->> 'money_mode' else l.money_mode end,
                player_note = case when v_patch ? 'player_note'
                  then v_patch ->> 'player_note' else l.player_note end,
                gm_note = case when v_patch ? 'gm_note' then v_patch ->> 'gm_note' else l.gm_note end
              where l.id = (v_op ->> 'id')::uuid;
            -- A row deleted meanwhile, or hidden by row level security, is
            -- reported, so the client does not show a gone list as saved.
            if not found then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
        when 'remove' then
          delete from public.lists l where l.id = (v_op ->> 'id')::uuid;
        when 'update_entry' then
          if v_op ->> 'id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          v_patch := v_op -> 'patch';
          if jsonb_typeof(v_patch) is distinct from 'object' then
            raise exception 'apply_list_writes: invalid patch' using errcode = '22023';
          end if;
          select k into v_field from jsonb_object_keys(v_patch) as k
            where k not in ('quantity', 'price_coins', 'player_note', 'gm_note') limit 1;
          if found then
            raise exception 'apply_list_writes: unknown field %', v_field using errcode = '22023';
          end if;
          if v_patch <> '{}'::jsonb then
            update public.list_entries e set
                quantity = case when v_patch ? 'quantity'
                  then (v_patch ->> 'quantity')::integer else e.quantity end,
                price_coins = case when v_patch ? 'price_coins'
                  then (v_patch ->> 'price_coins')::integer else e.price_coins end,
                player_note = case when v_patch ? 'player_note'
                  then v_patch ->> 'player_note' else e.player_note end,
                gm_note = case when v_patch ? 'gm_note' then v_patch ->> 'gm_note' else e.gm_note end
              where e.id = (v_op ->> 'id')::uuid;
            if not found then
              raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
            end if;
          end if;
        when 'relink' then
          if v_op ->> 'id' is null or v_op ->> 'hb_item' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          update public.list_entries e set hb_item = (v_op ->> 'hb_item')::uuid
            where e.id = (v_op ->> 'id')::uuid;
          if not found then
            raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
          end if;
        when 'remove_entries' then
          if jsonb_typeof(v_op -> 'ids') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid ids' using errcode = '22023';
          end if;
          delete from public.list_entries e
            where e.id in (select x::uuid from jsonb_array_elements_text(v_op -> 'ids') as x);
        when 'reorder' then
          if v_op ->> 'list_id' is null then
            raise exception 'apply_list_writes: invalid id' using errcode = '22023';
          end if;
          if jsonb_typeof(v_op -> 'ids') is distinct from 'array' then
            raise exception 'apply_list_writes: invalid ids' using errcode = '22023';
          end if;
          if not exists (select 1 from public.lists l where l.id = (v_op ->> 'list_id')::uuid) then
            raise exception 'apply_list_writes: the list or entry is gone' using errcode = 'P0002';
          end if;
          perform public.reorder_list((v_op ->> 'list_id')::uuid, array(
            select t.x::uuid from jsonb_array_elements_text(v_op -> 'ids')
              with ordinality as t(x, n) order by t.n));
        else
          raise exception 'apply_list_writes: unknown op %', coalesce(v_kind, 'null')
            using errcode = '22023';
      end case;
      v_out := v_out || jsonb_build_array(jsonb_build_object('ok', true));
    exception
      -- The whole call fails and the client sends it again: a later write
      -- may depend on the one these undid.
      when serialization_failure or deadlock_detected then
        raise;
      when others then
        get stacked diagnostics v_state = returned_sqlstate, v_msg = message_text,
          v_detail = pg_exception_detail;
        v_out := v_out || jsonb_build_array(jsonb_build_object(
          'ok', false, 'code', v_state, 'message', v_msg, 'details', nullif(v_detail, '')));
    end;
  end loop;
  return v_out;
end;
$$;

-- 20260930120000_import_lists_ceiling.sql's body with the entry shape of
-- apply_list_writes(): hb_item in place of a snapshot, a snapshot refused.
create or replace function public.import_lists(p_lists jsonb)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_id uuid;
  v_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'import_lists: not signed in' using errcode = '28000';
  end if;
  if p_lists is null or jsonb_typeof(p_lists) <> 'array' or jsonb_array_length(p_lists) > 1000 then
    raise exception 'import_lists: not a list of at most 1000 lists' using errcode = '22023';
  end if;
  for v_item in
    select t.e from jsonb_array_elements(p_lists) with ordinality as t(e, n) order by t.n
  loop
    -- The 5000 bound is apply_list_writes' own: the entries limit trigger answers
    -- only after the whole insert, so a huge array would cost the statement timeout.
    if jsonb_typeof(v_item) is distinct from 'object'
      or jsonb_typeof(v_item -> 'list') is distinct from 'object'
      or jsonb_typeof(v_item -> 'entries') is distinct from 'array'
      or jsonb_array_length(v_item -> 'entries') > 5000 then
      raise exception 'import_lists: invalid list' using errcode = '22023';
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_item -> 'entries') as t(e)
      where jsonb_typeof(t.e) = 'object'
        and coalesce(t.e -> 'snapshot', 'null'::jsonb) <> 'null'::jsonb
    ) then
      raise exception 'import_lists: an entry holds a snapshot; send hb_item instead'
        using errcode = '22023';
    end if;
    v_id := (v_item #>> '{list,id}')::uuid;
    insert into public.lists (id, owner_id, name, money_mode, player_note, gm_note)
      select v_id, auth.uid(), x.name, x.money_mode, x.player_note, x.gm_note
      from jsonb_to_record(v_item -> 'list')
        as x(name text, money_mode text, player_note text, gm_note text)
      on conflict (id) do nothing;
    if found then
      v_count := v_count + 1;
    -- Row level security hides another owner's row: a conflict with it inserts
    -- nothing, and this read finds nothing. A row found is the caller's: a retry.
    elsif not exists (select 1 from public.lists l where l.id = v_id) then
      raise exception 'import_lists: the id belongs to another list' using errcode = '42501';
    end if;
    insert into public.list_entries (id, list_id, item_key, source, hb_item, position,
        quantity, price_coins, player_note, gm_note)
      select x.id, v_id, x.item_key, x.source, x.hb_item, x.position, x.quantity,
        x.price_coins, x.player_note, x.gm_note
      from jsonb_to_recordset(v_item -> 'entries') as x(id uuid, item_key text,
        source text, hb_item uuid, position integer, quantity integer,
        price_coins integer, player_note text, gm_note text)
      on conflict (id) do nothing;
  end loop;
  return v_count;
end;
$$;

-- 20261007120000_lifecycle_cleanup.sql's body: a request goes once its
-- expires_at has passed, decided or not, and a notice 1 hour after its read or
-- 30 days after its creation while unread.
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
  return jsonb_build_object('requests', v_requests, 'shares', v_shares, 'runs', v_runs,
    'notices', v_notices);
end;
$$;
