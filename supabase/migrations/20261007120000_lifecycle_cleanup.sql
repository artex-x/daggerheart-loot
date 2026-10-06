-- Lifecycle rows are deleted by the database on a schedule: pg_cron runs
-- public.lifecycle_cleanup() hourly as postgres, and create_purchase_request()
-- no longer deletes at write time. docs/specs/META.md, section 3;
-- docs/decisions/2026-10-07-lifecycle-data-is-deleted-by-the-database-on-a-schedule.md.

create extension if not exists pg_cron with schema pg_catalog;

-- Deletes the rows past their retention and answers the counts (pg_cron's
-- run log keeps only the command tag). No API role executes it.
create function public.lifecycle_cleanup()
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_requests integer;
  v_shares integer;
  v_runs integer;
begin
  delete from public.purchase_requests r
    where r.decided_at < now() - interval '24 hours'
      or (r.status = 'pending' and r.expires_at < now() - interval '24 hours');
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
  delete from cron.job_run_details d where d.end_time < now() - interval '7 days';
  get diagnostics v_runs = row_count;
  return jsonb_build_object('requests', v_requests, 'shares', v_shares, 'runs', v_runs);
end;
$$;

-- service_role too: Supabase's default privileges grant it EXECUTE on every
-- new public function.
revoke execute on function public.lifecycle_cleanup()
  from public, anon, authenticated, service_role;

-- The body of 20260928120000_purchase_requests.sql without its write-time
-- delete; create or replace keeps the grants.
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

select cron.schedule('dhloot-lifecycle', '7 * * * *', 'select public.lifecycle_cleanup()');
