-- Takes back the E2E admin client's read and delete on the cloud lists.
revoke select, delete on table public.lists, public.list_entries, public.list_shares
  from service_role;
