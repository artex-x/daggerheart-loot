-- Deletes the signed-in user's account: the row in auth.users, and with it
-- every identity, session and row that references it on delete cascade.
-- Security definer, because the caller may not touch auth.users itself; the
-- caller is always auth.uid(), never an argument. docs/specs/FEATURES.md,
-- "Account".
-- `create function`, not `create or replace`: a reversal that forgets the
-- drop then fails the up-down-up gate on the second up.
create function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'delete_account: not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
