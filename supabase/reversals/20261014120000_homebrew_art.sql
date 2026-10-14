-- Undoes 20261014120000_homebrew_art.sql: the picture triggers, art_delete, the
-- insert policy and its two functions, homebrew_items.art with every stored
-- picture reference, the released names and pg_net go, and the four bodies
-- come back verbatim. The bucket and its files stay: Storage refuses a delete
-- of its tables from SQL, and the owner empties the bucket with the CLI.
-- Before any later up, delete the Vault secret dhloot_storage_key or restore
-- art from a backup, or the job deletes every file: .claude/README.md, "To
-- undo 20261014120000_homebrew_art".
drop trigger homebrew_items_art_release on public.homebrew_items;
drop trigger homebrew_items_art_owned on public.homebrew_items;
drop function public.homebrew_items_art_release();
drop function public.homebrew_items_art_owned();
drop function public.art_delete(text[]);
drop policy homebrew_art_insert on storage.objects;
drop function public.homebrew_art_room();
drop function public.homebrew_art_name_ok(text);
drop index public.homebrew_items_art;
alter table public.homebrew_items drop constraint homebrew_items_art_shape;
alter table public.homebrew_items drop column art;
drop table public.homebrew_art_released;

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
    -- item, its source, its cards or a related item.
    'revision', md5((v_record || jsonb_build_object('related', v_related))::text),
    'item', v_record,
    'related', v_related,
    'updated_at', v_updated);
end;
$$;

-- The linked items of the account's lists in one read: [{ hid, item }] for each
-- id that exists, in the given order. Signed in only: a shared page reads
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
        order by u.n)
    from (select x.id, min(x.n) as n from unnest(p_ids) with ordinality as x(id, n)
          group by x.id) u
    join public.homebrew_items i on i.id = u.id), '[]'::jsonb);
end;
$$;

-- 20261007130000_homebrew_links.sql's projection: a players' share leaves out
-- the GM-only entries, with their hid and record, and numbers the rest from 0;
-- a GM's share writes gm_only on each entry. Every later redefinition keeps
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
             else jsonb_build_object('hid', e.hb_item) end
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note, 'gm_only', e.gm_only)
             else '{}'::jsonb end
          order by e.ord)
      from (select e.*, row_number() over (order by e.position, e.id) - 1 as ord
          from public.list_entries e
          where e.list_id = v_list.id and (v_gm or not e.gm_only)) e), '[]'::jsonb));
end;
$$;

drop extension if exists pg_net;
