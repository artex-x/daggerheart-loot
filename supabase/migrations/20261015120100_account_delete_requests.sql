-- Deletes up to 200 of the signed-in user's purchase requests, with their
-- lines, and answers how many it deleted. The client calls it until it
-- answers 0, then calls delete_account(): at three times every limit the
-- requests' 1.35 million lines alone pass the statement timeout in one
-- delete, and that timeout covers the whole RPC call, so the bound is per
-- call. 200 requests are at most 60 000 lines (request_lines 300).
-- Security definer, as delete_account(): the caller is always auth.uid(),
-- never an argument. delete_account() is unchanged; a stale tab calls it
-- alone. docs/decisions/2026-10-16-an-account-delete-removes-its-purchase-requests.md.
-- `create function`, not `create or replace`: a reversal that forgets the
-- drop then fails the up-down-up gate on the second up.
create function public.delete_account_requests()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_n integer;
begin
  if v_uid is null then
    raise exception 'delete_account_requests: not signed in' using errcode = '28000';
  end if;
  delete from public.purchase_requests r
    where r.id in (
      select q.id from public.lists l
        join public.list_shares s on s.list_id = l.id
        join public.purchase_requests q on q.share_id = s.id
      where l.owner_id = v_uid
      limit 200);
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.delete_account_requests() from public, anon;
grant execute on function public.delete_account_requests() to authenticated;
