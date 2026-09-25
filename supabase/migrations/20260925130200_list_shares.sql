-- Share links of a cloud list: at most one active player link and one
-- active GM link per list. The owner reads its shares and changes them
-- only through the functions below; anyone holding a token reads the
-- list's projection through get_shared_list(), and a signed-in user saves
-- a copy of it through clone_shared_list(). The raw token is stored: a
-- hash beside it would protect nothing. docs/specs/FEATURES.md, "Lists".
create table public.list_shares (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  audience text not null check (audience in ('player', 'gm')),
  -- 32 bytes from two random uuids, base64url without padding: 43 chars.
  token text not null unique
    default translate(
      rtrim(encode(decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
        'hex'), 'base64'), '='),
      '+/', '-_')
    check (token ~ '^[A-Za-z0-9_-]{43}$'),
  topic_key uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index list_shares_active on public.list_shares (list_id, audience)
  where revoked_at is null;

alter table public.list_shares enable row level security;

-- No insert, update or delete grant: a share changes only through the
-- functions, which check the owner.
revoke all on table public.list_shares from public, anon, authenticated;
grant select on table public.list_shares to authenticated;

create policy list_shares_select on public.list_shares
  for select to authenticated using (exists (
    select 1 from public.lists l where l.id = list_id and l.owner_id = (select auth.uid())));

-- Returns the list's active share of the audience, or a new one.
create function public.create_list_share(p_list uuid, p_audience text)
returns table (id uuid, token text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_audience is null or p_audience not in ('player', 'gm') then
    raise exception 'create_list_share: unknown audience %', p_audience using errcode = '22023';
  end if;
  -- The row lock orders two calls for one list, so neither trips the
  -- unique index.
  perform 1 from public.lists l
    where l.id = p_list and l.owner_id = auth.uid()
    for no key update;
  if not found then
    raise exception 'create_list_share: not the owner of the list' using errcode = '42501';
  end if;
  select s.id, s.token into id, token from public.list_shares s
    where s.list_id = p_list and s.audience = p_audience and s.revoked_at is null;
  if not found then
    insert into public.list_shares as s (list_id, audience)
      values (p_list, p_audience)
      returning s.id, s.token into id, token;
  end if;
  return next;
end;
$$;

-- Stops the share; a share already stopped stays as it is.
create function public.revoke_list_share(p_share uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.list_shares s
    join public.lists l on l.id = s.list_id
    where s.id = p_share and l.owner_id = auth.uid();
  if not found then
    raise exception 'revoke_list_share: not the owner of the share' using errcode = '42501';
  end if;
  update public.list_shares s set revoked_at = now()
    where s.id = p_share and s.revoked_at is null;
end;
$$;

-- The list as a share's audience sees it, or null for a token that is
-- null, malformed, unknown or stopped - one answer for all four, so the
-- page cannot tell them apart. A player share omits both gm_note keys.
create function public.get_shared_list(p_token text)
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
            'snapshot', e.snapshot,
            'position', e.position,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note)
             else '{}'::jsonb end
          order by e.position, e.id)
      from public.list_entries e where e.list_id = v_list.id), '[]'::jsonb));
end;
$$;

-- Saves a copy of a shared list as the caller's list p_id. It copies what
-- get_shared_list() shows, so a player link's copy has no GM notes. A
-- second call with the same p_id returns it and inserts nothing; a p_id
-- of another user's list is refused.
create function public.clone_shared_list(p_token text, p_id uuid)
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
      id, list_id, item_key, source, snapshot, position, quantity, price_coins,
      player_note, gm_note)
    select
      gen_random_uuid(),
      p_id,
      e ->> 'item_key',
      e ->> 'source',
      nullif(e -> 'snapshot', 'null'::jsonb),
      (e ->> 'position')::integer,
      (e ->> 'quantity')::integer,
      (e ->> 'price_coins')::integer,
      e ->> 'player_note',
      coalesce(e ->> 'gm_note', '')
    from jsonb_array_elements(v_shared -> 'entries') as e;
  return p_id;
end;
$$;

revoke execute on function public.create_list_share(uuid, text) from public, anon;
revoke execute on function public.revoke_list_share(uuid) from public, anon;
revoke execute on function public.clone_shared_list(text, uuid) from public, anon;
grant execute on function public.create_list_share(uuid, text) to authenticated;
grant execute on function public.revoke_list_share(uuid) to authenticated;
grant execute on function public.clone_shared_list(text, uuid) to authenticated;
-- The one public function anon may execute: a share link opens signed out.
revoke execute on function public.get_shared_list(text) from public;
grant execute on function public.get_shared_list(text) to anon, authenticated;
