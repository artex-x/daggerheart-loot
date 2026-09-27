-- Purchase requests from a share link to the list's owner: any holder of an
-- active player or GM link sends one through create_purchase_request(), which
-- holds every bound; the owner reads, applies or declines it; each send and
-- decision nudges the owner's topic. A request stores no requester name,
-- account or address. docs/specs/FEATURES.md, "Account and browser lists";
-- docs/decisions/2026-09-26-purchase-requests-are-written-only-by-a-bounded.md.

insert into public.limit_defaults (key, value)
  values ('request_lines', 100), ('pending_requests_per_list', 10);

create table public.purchase_requests (
  -- Made by the client: the transport may send a request twice, and the
  -- same id makes the second send a replay that inserts nothing.
  id uuid primary key,
  list_id uuid not null references public.lists (id) on delete cascade,
  share_id uuid not null references public.list_shares (id) on delete cascade,
  audience text not null check (audience in ('player', 'gm')),
  status text not null default 'pending' check (status in ('pending', 'applied', 'declined')),
  created_at timestamptz not null default now(),
  -- Set by the function, not generated: timestamptz + interval is not
  -- immutable. A pending row past it reads as expired.
  expires_at timestamptz not null,
  decided_at timestamptz,
  check ((status = 'pending') = (decided_at is null))
);

create index purchase_requests_list_pending on public.purchase_requests (list_id)
  where status = 'pending';
create index purchase_requests_share_created on public.purchase_requests (share_id, created_at);

-- A line names its item, not an entry: the owner's undo re-adds an entry
-- under a new id, and an apply must still find it.
create table public.purchase_request_lines (
  request_id uuid not null references public.purchase_requests (id) on delete cascade,
  item_key text not null check (item_key ~ '^[A-Za-z0-9_-]{1,64}$'),
  quantity integer not null check (quantity between 1 and 99),
  price_coins integer check (price_coins is null or price_coins between 1 and 99999),
  applied_quantity integer check (applied_quantity is null or applied_quantity between 0 and 99),
  primary key (request_id, item_key)
);

alter table public.purchase_requests enable row level security;
alter table public.purchase_request_lines enable row level security;

-- No insert, update or delete grant: a request changes only through the
-- functions below.
revoke all on table public.purchase_requests from public, anon, authenticated;
revoke all on table public.purchase_request_lines from public, anon, authenticated;
grant select on table public.purchase_requests to authenticated;
grant select on table public.purchase_request_lines to authenticated;

create policy purchase_requests_owner_select on public.purchase_requests
  for select to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));
create policy purchase_request_lines_owner_select on public.purchase_request_lines
  for select to authenticated using (exists (
    select 1 from public.purchase_requests r
      join public.lists l on l.id = r.list_id
    where r.id = request_id and l.owner_id = (select auth.uid())));

-- The hosted E2E's admin client reads and clears the requests, as
-- 20260925130300_lists_service_role.sql grants for the lists.
grant select, delete on table public.purchase_requests, public.purchase_request_lines
  to service_role;

-- Sends a request for p_lines ([{ item, qty }]) through an active share
-- token. Answers nothing; every refusal is an exception the client maps.
create function public.create_purchase_request(p_id uuid, p_token text, p_lines jsonb)
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

  -- Only now that the call inserts: a refused call scans nothing and locks
  -- no row.
  delete from public.purchase_requests r
    where r.decided_at < now() - interval '24 hours'
      or (r.status = 'pending' and r.expires_at < now() - interval '24 hours');

  insert into public.purchase_requests (id, list_id, share_id, audience, expires_at)
    values (p_id, v_share.list_id, v_share.id, v_share.audience, now() + interval '1 hour')
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

-- Takes each line's count from the list's entry of the same item, or
-- answers { short } and changes nothing when the stock is too low (with
-- p_clamp, only when nothing is there). An entry taken whole is deleted.
create function public.apply_purchase_request(p_id uuid, p_clamp boolean default false)
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

create function public.decline_purchase_request(p_id uuid)
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
  if v_req.expires_at <= now() then
    raise exception 'request: expired' using errcode = '22023';
  end if;
  update public.purchase_requests r set status = 'declined', decided_at = now()
    where r.id = p_id;
end;
$$;

-- A new request or a decision tells the owner's devices which list to
-- read again; no share topic hears of a request.
create function public.purchase_requests_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_raw text;
  v_by text;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return null;
  end if;
  begin
    select l.owner_id into v_owner from public.lists l where l.id = new.list_id;
    -- Not on insert: a requester's tab id would link its requests in
    -- realtime.messages, and no reader needs it there.
    if tg_op = 'UPDATE' then
      -- A session that set the headers in an earlier transaction reads ''.
      v_raw := nullif(current_setting('request.headers', true), '');
      begin
        v_by := (v_raw::jsonb) ->> 'x-dhloot-tab';
      exception when others then
        v_by := null;
      end;
      if v_by is not null and v_by !~ '^[A-Za-z0-9-]{1,40}$' then
        v_by := null;
      end if;
    end if;
    perform realtime.send(
      jsonb_build_object('list', new.list_id, 'by', v_by),
      'request', 'owner:' || v_owner::text, true);
  exception when others then
    -- A broadcast never fails a request or a decision.
    raise warning 'purchase_requests_broadcast: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;

create trigger purchase_requests_broadcast
  after insert or update of status on public.purchase_requests
  for each row execute function public.purchase_requests_broadcast();

revoke execute on function public.create_purchase_request(uuid, text, jsonb)
  from public, anon, authenticated;
revoke execute on function public.apply_purchase_request(uuid, boolean)
  from public, anon, authenticated;
revoke execute on function public.decline_purchase_request(uuid)
  from public, anon, authenticated;
revoke execute on function public.purchase_requests_broadcast()
  from public, anon, authenticated;
-- The second function anon may execute: a share link's holder sends a
-- request signed out.
grant execute on function public.create_purchase_request(uuid, text, jsonb)
  to anon, authenticated;
grant execute on function public.apply_purchase_request(uuid, boolean) to authenticated;
grant execute on function public.decline_purchase_request(uuid) to authenticated;
