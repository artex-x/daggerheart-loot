-- A shared page's re-read builds only the records the reader does not hold,
-- reorder_list() runs under the caller's policies, and the owner deletes many
-- own items in one call.
-- docs/decisions/2026-10-22-a-shared-records-rev-is-made-from-its-revisions.md;
-- docs/decisions/2026-10-22-a-bulk-delete-of-own-items-is-one-invoker-call.md.

-- The version of the record homebrew_item_record() builds for one item: the
-- revisions of the item, its source and the cards it names, matched as
-- homebrew_item_record() matches them. An item update (content, book_id, art)
-- raises the item's revision, a source's delete sets book_id null, a card edit
-- raises the card's revision, and a card added or deleted changes the id list.
-- The leading 1 is the format of the record: a migration that changes what
-- homebrew_item_record() or homebrew_snapshot_of(text,jsonb,jsonb,jsonb)
-- builds raises it (tests/db/list-shares.test.mjs pins both definitions).
-- Null for an unknown id. Runs only inside get_shared_list(). The set key and
-- the refs are read into variables once: read per card row, the content of a
-- long item was detoasted once per card (2.7 s for 300 entries and 300 cards,
-- measured 2026-10-22 on this host).
create function public.homebrew_item_rev(p_id uuid)
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
  v_revision bigint;
  v_set text;
  v_refs jsonb;
  v_book text;
  v_cards text;
begin
  select i.owner_id, i.revision, i.content ->> 'set',
      coalesce(i.content -> 'refs', '[]'::jsonb),
      coalesce(b.id::text || ':' || b.revision, '-')
    into v_owner, v_revision, v_set, v_refs, v_book
    from public.homebrew_items i
    left join public.homebrew_books b on b.id = i.book_id
    where i.id = p_id;
  if not found then
    return null;
  end if;
  select string_agg(c.id::text || ':' || c.revision, ',' order by c.id) into v_cards
    from public.homebrew_cards c
    where c.owner_id = v_owner
      and ((c.kind = 'set' and c.key = v_set) or (c.kind = 'ref' and v_refs ? c.key));
  return md5('1|' || v_revision || '|' || v_book || '|' || coalesce(v_cards, ''));
end;
$$;

revoke execute on function public.homebrew_item_rev(uuid)
  from public, anon, authenticated, service_role;

-- The projection of 20261014120000_homebrew_art.sql's get_shared_list(text)
-- (audience, the GM-only rule, numbering, img, notes), built here once: the
-- share and the revision are checked before any build. With p_have null (the
-- two older forms) a homebrew entry carries its record and no rev; else each
-- homebrew entry carries rev, and its record only when p_have does not map its
-- hid to that rev. An official entry carries snapshot null. A p_have that is
-- not an object or is over 64 KiB counts as {}. Security definer: anon reads
-- neither list_shares nor lists.
create or replace function public.get_shared_list(p_token text, p_since bigint, p_have jsonb)
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
  v_have jsonb := case when jsonb_typeof(p_have) = 'object'
    and octet_length(p_have::text) <= 65536 then p_have else '{}'::jsonb end;
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
  if p_since is not null and v_list.revision <= p_since then
    return jsonb_build_object('unchanged', true);
  end if;
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
            'position', e.ord,
            'quantity', e.quantity,
            'price_coins', e.price_coins,
            'player_note', e.player_note)
          || case when e.hb_item is null then jsonb_build_object('snapshot', null)
             when r.rev is null
               then jsonb_build_object('snapshot', public.homebrew_item_record(e.hb_item))
             when v_have ->> e.hb_item::text = r.rev then jsonb_build_object('rev', r.rev)
             else jsonb_build_object('rev', r.rev,
               'snapshot', public.homebrew_item_record(e.hb_item)) end
          || case when e.hb_item is null then '{}'::jsonb
             else jsonb_strip_nulls(jsonb_build_object('hid', e.hb_item,
               'img', (select i.art from public.homebrew_items i where i.id = e.hb_item))) end
          || case when v_gm then jsonb_build_object('gm_note', e.gm_note, 'gm_only', e.gm_only)
             else '{}'::jsonb end
          order by e.ord)
      from (select e.*, row_number() over (order by e.position, e.id) - 1 as ord
          from public.list_entries e
          where e.list_id = v_list.id and (v_gm or not e.gm_only)) e
      cross join lateral (select case when p_have is not null and e.hb_item is not null
          then public.homebrew_item_rev(e.hb_item) end as rev) r), '[]'::jsonb));
end;
$$;

-- The two older forms answer what they answered before: no rev, every record.
-- Security invoker: the definer above builds the projection.
create or replace function public.get_shared_list(p_token text, p_since bigint)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select public.get_shared_list(p_token, p_since, null::jsonb);
$$;

create or replace function public.get_shared_list(p_token text)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select public.get_shared_list(p_token, null::bigint, null::jsonb);
$$;

-- Security invoker: its owner check and its update run under the caller's
-- policies (lists_select, list_entries_update), which allow the owner's own
-- reorder. apply_list_writes() (invoker) and apply_purchase_request()
-- (definer) call it.
alter function public.reorder_list(uuid, uuid[]) security invoker;

-- Deletes the caller's own items of p_ids in one statement, all or none, and
-- answers the count; another account's id or an unknown id is left and not
-- counted. The row triggers do the rest: the notices, the cascade to
-- list_entries, the picture release. Security invoker: the owner's delete
-- policy allows it.
create function public.delete_homebrew_items(p_ids uuid[])
returns integer
language plpgsql
volatile
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_ids is null or cardinality(p_ids) > 1000 then
    raise exception 'delete_homebrew_items: not a list of at most 1000 ids'
      using errcode = '22023';
  end if;
  delete from public.homebrew_items i where i.id = any(p_ids) and i.owner_id = auth.uid();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.delete_homebrew_items(uuid[]) from public, anon, service_role;
grant execute on function public.delete_homebrew_items(uuid[]) to authenticated;
