-- Puts back the broadcast of 20260928120000_purchase_requests.sql: the owner
-- topic alone hears a request or a decision.
create or replace function public.purchase_requests_broadcast()
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
