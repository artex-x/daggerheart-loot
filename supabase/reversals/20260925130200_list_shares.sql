-- Removes the share links: the four functions, then list_shares with its
-- index, policy and grants.
drop function public.clone_shared_list(text, uuid);
drop function public.get_shared_list(text);
drop function public.revoke_list_share(uuid);
drop function public.create_list_share(uuid, text);
drop table public.list_shares;
