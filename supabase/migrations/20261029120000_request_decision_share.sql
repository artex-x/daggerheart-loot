-- A decision also tells the request's own share topic: `request` with
-- { request, status, partial } on share:<topic_key> while the share is active, so the
-- tab that sent the request can say the answer. The owner-topic message is
-- unchanged, and a failed share send never fails the decision or the owner message.
-- The key is `request`, not `id`: realtime.send adds the message id as `id`.
-- docs/decisions/2026-10-29-a-sender-hears-a-decision-while-the-page-stays-open.md.
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
  v_topic uuid;
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
    -- The payload holds no list, line, name or account: only the random id the
    -- sending tab made. apply_purchase_request sets the lines before the status,
    -- so this AFTER trigger reads the final applied counts.
    if tg_op = 'UPDATE' and new.status in ('applied', 'declined') then
      begin
        select s.topic_key into v_topic from public.list_shares s
          where s.id = new.share_id and s.revoked_at is null;
        if found then
          perform realtime.send(
            jsonb_build_object(
              'request', new.id,
              'status', new.status,
              'partial', exists (
                select 1 from public.purchase_request_lines pl
                where pl.request_id = new.id
                  and pl.applied_quantity is not null
                  and pl.applied_quantity < pl.quantity)),
            'request', 'share:' || v_topic::text, true);
        end if;
      exception when others then
        raise warning 'purchase_requests_broadcast share: % (%)', sqlerrm, sqlstate;
      end;
    end if;
  exception when others then
    -- A broadcast never fails a request or a decision.
    raise warning 'purchase_requests_broadcast: % (%)', sqlerrm, sqlstate;
  end;
  return null;
end;
$$;
